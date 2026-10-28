import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import axios from "axios";
import FormData from "form-data";

import { Product } from "../products/product.entity";
import { ProductImageEmbedding } from "./product-image-embedding.entity";
import { StorageService } from "../storage/storage.service";

@Injectable()
export class VisualSearchService {
  private readonly aiUrl =
    process.env.VISUAL_SEARCH_AI_URL ?? "http://127.0.0.1:8001";

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImageEmbedding)
    private readonly embeddingRepository: Repository<ProductImageEmbedding>,

    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  async checkAiHealth() {
    try {
      const response = await axios.get(`${this.aiUrl}/health`, {
        timeout: 10000,
      });

      return {
        connected: true,
        ...response.data,
      };
    } catch {
      throw new ServiceUnavailableException(
        "Visual search AI service is unavailable. Check the Python service.",
      );
    }
  }

  async searchByImage(image: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.mimetype)) {
      throw new BadRequestException(
        "Only JPEG, PNG and WEBP images are supported",
      );
    }

    if (image.buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException("Image size must be 5 MB or less");
    }

    // Send the uploaded image to the Python CLIP service.
    const form = new FormData();

    form.append("image", image.buffer, {
      filename: image.originalname || "search-image.jpg",
      contentType: image.mimetype,
    });

    let response;

    try {
      response = await axios.post(`${this.aiUrl}/embed`, form, {
        headers: form.getHeaders(),
        timeout: 60000,
        maxBodyLength: 6 * 1024 * 1024,
      });
    } catch {
      throw new ServiceUnavailableException(
        "Could not generate the search image embedding",
      );
    }

    const embedding = response.data.embedding;

    if (
      !Array.isArray(embedding) ||
      embedding.length !== 512 ||
      !embedding.every(
        (value: unknown) => typeof value === "number" && Number.isFinite(value),
      )
    ) {
      throw new BadRequestException(
        "Python AI service returned an invalid embedding",
      );
    }

    // Find the closest product images using cosine distance.
    const vectorValue = `[${embedding.join(",")}]`;

    const products = await this.dataSource.query(
      `SELECT
     p.id,
     p.name,
     p.price,
     p.quantity,
     p."imageUrl",
     e.embedding <=> $1::vector AS distance
   FROM product_image_embeddings e
   INNER JOIN product p ON p.id = e.product_id
   WHERE 1 - (e.embedding <=> $1::vector) >= 0.70
   ORDER BY e.embedding <=> $1::vector
   LIMIT 10`,
      [vectorValue],
    );

    return {
      count: products.length,
      products: products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        imageUrl: product.imageUrl,
        similarity: Math.max(0, Math.min(1, 1 - Number(product.distance))),
      })),
    };
  }

  async indexProductImage(productId: number) {
    const product = await this.productRepository.findOneBy({
      id: productId,
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    if (!product.imageUrl) {
      throw new BadRequestException("This product does not have an image");
    }

    // 1. Download the product image from Azure Blob Storage.
    const imageBuffer = await this.storageService.downloadFile(
      product.imageUrl,
    );

    // 2. Prepare the image for the Python CLIP service.
    const extension = new URL(product.imageUrl).pathname
      .toLowerCase()
      .split(".")
      .pop();

    const contentType =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";

    const form = new FormData();

    form.append("image", imageBuffer, {
      filename: `product-${productId}.${extension || "jpg"}`,
      contentType,
    });

    // 3. Ask Python to generate the image embedding.
    let response;

    try {
      response = await axios.post(`${this.aiUrl}/embed`, form, {
        headers: form.getHeaders(),
        timeout: 60000,
        maxBodyLength: 6 * 1024 * 1024,
      });
    } catch {
      throw new ServiceUnavailableException(
        "Could not generate the image embedding. Check the Python AI service.",
      );
    }

    const { embedding, model, dimensions } = response.data;

    if (
      !Array.isArray(embedding) ||
      embedding.length !== 512 ||
      !embedding.every(
        (value: unknown) => typeof value === "number" && Number.isFinite(value),
      )
    ) {
      throw new BadRequestException(
        "Python AI service returned an invalid embedding",
      );
    }

    // 4. Save or update this product's embedding in PostgreSQL.
    const vectorValue = `[${embedding.join(",")}]`;

    await this.dataSource.query(
      `INSERT INTO product_image_embeddings
        (product_id, embedding, model_name, created_at)
       VALUES ($1, $2::vector, $3, NOW())
       ON CONFLICT (product_id)
       DO UPDATE SET
         embedding = EXCLUDED.embedding,
         model_name = EXCLUDED.model_name,
         created_at = NOW()`,
      [product.id, vectorValue, model || "openai/clip-vit-base-patch32"],
    );

    return {
      success: true,
      message: "Product image indexed successfully",
      productId: product.id,
      productName: product.name,
      dimensions,
      model,
    };
  }
}
