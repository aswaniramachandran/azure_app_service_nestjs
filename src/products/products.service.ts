import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Filter, Repository } from "typeorm";

import { Product } from "./product.entity";
import { RedisService } from "../redis/redis.service";
import { StorageService } from "../storage/storage.service";
import { SearchProductsDto } from "./dto/search-products.dto";
import { Category } from "../categories/category.entity";
import { applySearch } from "../utils/search.util";
import { applyFilters, QueryFilter } from "../utils/filter.util";
import { applySort } from "../utils/sort.util";
import { applyPagination } from "../utils/pagination.util";
import { createPaginationResponse } from "../utils/response.util";
import { Brand } from "../brands/brand.entity";

const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,

    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,

    private redisService: RedisService,

    private storageService: StorageService,
  ) {}

  async create(data: any, image?: any) {
    if (data.categoryId !== undefined && data.categoryId !== "") {
      const category = await this.categoryRepo.findOne({
        where: {
          id: Number(data.categoryId),
        },
      });

      if (!category) {
        throw new BadRequestException("Category not found");
      }

      data.categoryId = Number(data.categoryId);
    } else {
      data.categoryId = null;
    }

      if (data.brandId !== undefined && data.brandId !== "") {
    const brand = await this.brandRepo.findOne({
      where: {
        id: Number(data.brandId),
      },
    });

    if (!brand) {
      throw new BadRequestException("Brand not found");
    }

    data.brandId = Number(data.brandId);
  } else {
    data.brandId = null;
  }

    if (image) {
      const imageUrl = await this.storageService.uploadFile(image);

      data.imageUrl = imageUrl;
    }

    const product = await this.repo.save(data);

    await this.redisService.getClient().del("products");

    return product;
  }

  async findAll(query: SearchProductsDto = {}) {
    const qb = this.repo.createQueryBuilder("p");

    // SEARCH
    applySearch(qb, query, ["p.name", "p.id", "p.price", "p.quantity"]);

    // FILTER

    // FILTERS
    const filters: QueryFilter[] = [];

    // Category filter
    if (query.categoryId) {
      filters.push({
        field: "p.categoryId",
        operator: "=",
        value: query.categoryId,
      });
    }


    // Brand filter
if (query.brandId) {
  filters.push({
    field: 'p.brandId',
    operator: '=',
    value: query.brandId,
  });
}

    // Stock filters
    if (query.stock === "out") {
      filters.push({
        field: "p.quantity",
        operator: "=",
        value: 0,
      });
    }

    if (query.stock === "low") {
      filters.push({
        field: "p.quantity",
        operator: ">",
        value: 0,
      });

      filters.push({
        field: "p.quantity",
        operator: "<=",
        value: 5,
      });
    }

    if (query.stock === "in") {
      filters.push({
        field: "p.quantity",
        operator: ">",
        value: 5,
      });
    }

    if (query.minPrice !== undefined) {
  filters.push({
    field: 'p.price',
    operator: '>=',
    value: query.minPrice,
  });
}

if (query.maxPrice !== undefined) {
  filters.push({
    field: 'p.price',
    operator: '<=',
    value: query.maxPrice,
  });
}

    applyFilters(qb, filters);

    
    // SORT
    const { sortBy, sortOrder } = applySort(qb, query, {
      id: "p.id",
      name: "p.name",
      price: "p.price",
      quantity: "p.quantity",
    });

    // PAGINATION
    applyPagination(qb, query);

    // DATABASE
    const [products, total] = await qb.getManyAndCount();

    // RESPONSE
    return createPaginationResponse(products, total, query, sortBy, sortOrder);
  }

  // =========================
  // FIND ONE PRODUCT
  // =========================

  findOne(id: number) {
    return this.repo.findOneBy({
      id,
    });
  }
  async update(id: number, body: any, image?: any) {
    const existing = await this.findOne(id);

    if (!existing) {
      throw new NotFoundException("Product not found");
    }

    const data: any = {};

    if (body.name !== undefined) {
      data.name = body.name;
    }

    if (body.price !== undefined) {
      data.price = Number(body.price);
    }

    if (body.quantity !== undefined) {
      data.quantity = Number(body.quantity);
    }

    if (body.categoryId !== undefined && body.categoryId !== "") {
      const category = await this.categoryRepo.findOne({
        where: {
          id: Number(body.categoryId),
        },
      });

      if (!category) {
        throw new BadRequestException("Category not found");
      }

      data.categoryId = Number(body.categoryId);
    }

    if (body.categoryId === "") {
      data.categoryId = null;
    }


    if (body.brandId !== undefined && body.brandId !== "") {
  const brand = await this.brandRepo.findOne({
    where: {
      id: Number(body.brandId),
    },
  });

  if (!brand) {
    throw new BadRequestException("Brand not found");
  }

  data.brandId = Number(body.brandId);
}

if (body.brandId === "") {
  data.brandId = null;
}

    if (image) {
      data.imageUrl = await this.storageService.uploadFile(image);
    }

    if (Object.keys(data).length > 0) {
      await this.repo.update(id, data);
    }

    if (image && existing.imageUrl) {
      await this.storageService.deleteFile(existing.imageUrl);
    }

    await this.redisService.getClient().del("products");

    return this.findOne(id);
  }

  async remove(id: number) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException("Product not found");

    const result = await this.repo.delete(id);
    await this.storageService.deleteFile(existing.imageUrl);
    await this.redisService.getClient().del("products");

    return result;
  }
}
