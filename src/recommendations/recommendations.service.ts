
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { Product } from "../products/product.entity";
import { Category } from "../categories/category.entity";
import { Cart } from "../cart/cart.entity";
import { CartItem } from "../cart/cart-item.entity";
import { Order } from "../orders/order.entity";
import { OrderItem } from "../orders/order-item.entity";

type RecommendationGroup = "laptop" | "audio" | "mobile" | "clothing" | "monitor";

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
  ) {}

  async getForProduct(productId: number, requestedLimit = 8) {
    const limit = Math.min(20, Math.max(1, Number(requestedLimit) || 8));
    const sourceProduct = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!sourceProduct) {
      return null;
    }

    const [categories, products] = await Promise.all([
      this.categoryRepo.find(),
      this.productRepo.find(),
    ]);
    const categoryNames = new Map(
      categories.map((category) => [Number(category.id), category.name]),
    );
    const sourceCategoryName = sourceProduct.categoryId == null
      ? ''
      : categoryNames.get(Number(sourceProduct.categoryId)) ?? '';
    const recommendationGroup = this.getRecommendationGroup(
      sourceProduct.name,
      sourceCategoryName,
    );

    if (!recommendationGroup) {
      return {
        productId,
        count: 0,
        recommendations: [],
      };
    }

    const ranked = products
      .filter((product) => (
        Number(product.id) !== productId &&
        Number(product.quantity) > 0 &&
        this.isRelatedProduct(
          recommendationGroup,
          product,
          categoryNames.get(Number(product.categoryId)) ?? '',
        )
      ))
      .map((product) => {
        const categoryName = product.categoryId == null
          ? ''
          : categoryNames.get(Number(product.categoryId)) ?? '';
        const sameCategory = sourceProduct.categoryId != null &&
          Number(product.categoryId) === Number(sourceProduct.categoryId);

        return {
          product,
          categoryName,
          score: sameCategory ? 2 : 1,
          reason: sameCategory
            ? `Similar ${recommendationGroup} product in ${sourceCategoryName}`
            : `Related ${recommendationGroup} product in ${categoryName || 'a related category'}`,
        };
      })
      .sort((a, b) => (
        b.score - a.score ||
        Number(a.product.id) - Number(b.product.id)
      ))
      .slice(0, limit)
      .map(({ product, categoryName, reason, score }) => ({
        id: Number(product.id),
        name: product.name,
        price: Number(product.price),
        quantity: product.quantity,
        imageUrl: product.imageUrl ?? null,
        categoryId: product.categoryId == null
          ? null
          : Number(product.categoryId),
        categoryName: categoryName || null,
        score,
        reason,
      }));

    return {
      productId,
      count: ranked.length,
      recommendations: ranked,
    };
  }

  private getRecommendationGroup(
    productName: string,
    categoryName: string,
  ): RecommendationGroup | null {
    const name = productName.toLowerCase();
    const category = categoryName.toLowerCase();

    if (/\b(laptop|notebook)\b/.test(name)) return 'laptop';
    if (/\b(headphones?|headsets?|earbuds?|earphones?|speakers?)\b/.test(name)) {
      return 'audio';
    }
    if (/\b(mobile|phone|smartphone)\b/.test(name)) return 'mobile';
    if (/\b(monitor|display)\b/.test(name)) return 'monitor';
    if (/\b(tvs?|televisions?)\b/.test(name)) return null;
    if (/\b(t-?shirts?|jeans|hoodies?|shirts?|clothing|apparel)\b/.test(name)) {
      return 'clothing';
    }
    if (/\b(headphones?|headsets?|audio)\b/.test(category)) return 'audio';
    if (/\b(mobile|phones?)\b/.test(category)) return 'mobile';
    if (/\b(monitors?|displays?)\b/.test(category)) return 'monitor';
    if (/\b(clothing|apparel|fashion)\b/.test(category)) return 'clothing';
    return null;
  }

  private isRelatedProduct(
    group: RecommendationGroup,
    product: Product,
    categoryName: string,
  ): boolean {
    const name = product.name.toLowerCase();
    const category = categoryName.toLowerCase();
    const productGroup = this.getRecommendationGroup(product.name, categoryName);

    if (productGroup === group) return true;

    switch (group) {
      case 'laptop':
        return /\b(mouse|mice|keyboards?|mouse pads?|usb hubs?|laptop stands?|laptop bags?|docking stations?)\b/.test(name) &&
          /\b(computer accessories|laptop accessories|accessories)\b/.test(category);
      case 'audio':
        return /\b(ear pads?|headphone stands?|audio cables?|microphones?)\b/.test(name) &&
          /\b(audio|headphone|accessor)\b/.test(category);
      case 'mobile':
        return /\b(power banks?|chargers?|charging cables?|phone cases?|screen protectors?)\b/.test(name) &&
          /\b(electronics|mobile|phone|accessor)\b/.test(category);
      case 'clothing':
        return /\b(watches?|sunglasses|backpacks?|wallets?|belts?|scarves?)\b/.test(name) &&
          /\b(accessor|fashion)\b/.test(category);
      case 'monitor':
        return /\b(monitor stands?|hdmi cables?|displayport cables?|display cables?)\b/.test(name) &&
          /\b(monitor|display|computer accessories|accessor)\b/.test(category);
    }
    return false;
  }

  async getForUser(userId: number, requestedLimit = 8) {
    const limit = Math.min(20, Math.max(1, Number(requestedLimit) || 8));

    // 1. Get the user's cart.
    const cart = await this.cartRepo.findOne({
      where: { userId },
    });

    const cartItems = cart
      ? await this.cartItemRepo.find({
          where: { cartId: cart.id },
        })
      : [];

    const cartProductIds = new Set(
      cartItems.map((item) => Number(item.productId)),
    );

    // 2. Get the user's order history.
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: { items: true },
    });

    const purchasedProductIds = new Set<number>();

    for (const order of orders) {
      for (const item of order.items ?? []) {
        if (item.productId != null) {
          purchasedProductIds.add(Number(item.productId));
        }
      }
    }

    // 3. Load products previously added to the cart or purchased.
    const interactedIds = new Set([
      ...cartProductIds,
      ...purchasedProductIds,
    ]);

    const interactedProducts = interactedIds.size
      ? await this.productRepo.find({
          where: { id: In([...interactedIds]) },
        })
      : [];

    // 4. Calculate cart and purchase-history category scores.
    const cartCategoryScores = new Map<number, number>();
    const purchaseCategoryScores = new Map<number, number>();

    for (const product of interactedProducts) {
      if (product.categoryId == null) continue;

      const productId = Number(product.id);
      const categoryId = Number(product.categoryId);

      if (cartProductIds.has(productId)) {
        cartCategoryScores.set(
          categoryId,
          (cartCategoryScores.get(categoryId) ?? 0) + 7,
        );
      }

      if (purchasedProductIds.has(productId)) {
        purchaseCategoryScores.set(
          categoryId,
          (purchaseCategoryScores.get(categoryId) ?? 0) + 5,
        );
      }
    }

    // 5. Get categories represented in the user's cart.
    const cartCategoryIds = new Set<number>(
      interactedProducts
        .filter(
          (product) =>
            cartProductIds.has(Number(product.id)) &&
            product.categoryId != null,
        )
        .map((product) => Number(product.categoryId)),
    );

    // 6. Calculate product popularity from order-item quantities.
    const popularityRows = await this.orderItemRepo
      .createQueryBuilder("item")
      .select("item.productId", "productId")
      .addSelect("SUM(item.quantity)", "purchaseCount")
      .where("item.productId IS NOT NULL")
      .groupBy("item.productId")
      .getRawMany();

    const popularity = new Map<number, number>();

    for (const row of popularityRows) {
      popularity.set(
        Number(row.productId),
        Math.max(0, Number(row.purchaseCount) || 0),
      );
    }

    // 7. Load products and exclude unavailable or already-interacted products.
    const products = await this.productRepo.find({
      take: 1000,
    });

    const candidates = products.filter(
      (product) =>
        Number(product.quantity) > 0 &&
        !purchasedProductIds.has(Number(product.id)) &&
        !cartProductIds.has(Number(product.id)),
    );

    // 8. Rank products using personalization, related categories, and popularity.
    const ranked = candidates.map((product) => {
      const productId = Number(product.id);

      const categoryId =
        product.categoryId == null
          ? null
          : Number(product.categoryId);

      const cartCategoryScore =
        categoryId === null
          ? 0
          : (cartCategoryScores.get(categoryId) ?? 0);

      const purchaseCategoryScore =
        categoryId === null
          ? 0
          : (purchaseCategoryScores.get(categoryId) ?? 0);

      const matchesCart = cartCategoryScore > 0;
      const matchesPurchaseHistory = purchaseCategoryScore > 0;

      const overlapBonus =
        matchesCart && matchesPurchaseHistory ? 3 : 0;

      const categoryScore =
        cartCategoryScore +
        purchaseCategoryScore +
        overlapBonus;

      // Related-product bonus: category 7 <-> category 8.
      const relatedCategoryBonus = this.getRelatedCategoryBonus(
        categoryId,
        cartCategoryIds,
      );

      const purchaseCount = popularity.get(productId) ?? 0;

      const popularityScore = Math.min(
        5,
        Math.log2(purchaseCount + 1),
      );

      const score =
        categoryScore +
        relatedCategoryBonus +
        popularityScore;

      let reason: string;

      if (matchesCart && matchesPurchaseHistory) {
        reason =
          "Matches categories in your cart and purchase history";
      } else if (matchesCart) {
        reason = "Matches a category in your cart";
      } else if (relatedCategoryBonus > 0) {
        reason = "Related to a product in your cart";
      } else if (matchesPurchaseHistory) {
        reason = "Matches a category from your purchase history";
      } else if (purchaseCount > 0) {
        reason = "Popular among previously purchased products";
      } else {
        reason = "Recommended from available products";
      }

      return {
        product,
        score,
        reason,
        categoryScore,
        relatedCategoryBonus,
        popularityScore,
      };
    });

    // 9. Sort by score, then category relevance, popularity, and product ID.
    ranked.sort(
      (a, b) =>
        b.score - a.score ||
        b.categoryScore - a.categoryScore ||
        b.relatedCategoryBonus - a.relatedCategoryBonus ||
        b.popularityScore - a.popularityScore ||
        Number(a.product.id) - Number(b.product.id),
    );

    // 10. Select actual database products before calling Ollama.
    const selected = ranked.slice(0, limit).map(
      ({ product, score, reason }) => ({
        id: Number(product.id),
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl ?? null,
        quantity: product.quantity,
        categoryId:
          product.categoryId == null
            ? null
            : Number(product.categoryId),
        score: Number(score.toFixed(2)),
        reason,
      }),
    );

    const explanations = await this.generateAiExplanations(selected);

    // 11. Return the existing response format.
    return {
      userId,
      count: selected.length,
      recommendations: selected.map((product) => ({
        ...product,
        aiExplanation:
          explanations[String(product.id)] ?? product.reason,
      })),
    };
  }

  // Starter category mapping based on the sample product IDs/categories.
  private getRelatedCategoryBonus(
    productCategoryId: number | null,
    cartCategoryIds: Set<number>,
  ): number {
    if (productCategoryId === null) {
      return 0;
    }

    const relatedCategories: Record<number, number[]> = {
      7: [8], // Gaming headset category -> computer accessories
      8: [7], // Computer accessories -> gaming headset category
    };

    let bonus = 0;

    for (const cartCategoryId of cartCategoryIds) {
      const related = relatedCategories[cartCategoryId] ?? [];

      if (related.includes(productCategoryId)) {
        bonus = Math.max(bonus, 8);
      }
    }

    return bonus;
  }

  private async generateAiExplanations(
    products: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number | null;
      categoryId: number | null;
      score: number;
      reason: string;
    }>,
  ): Promise<Record<string, string>> {
    if (products.length === 0) {
      return {};
    }

    try {
      const response = await fetch(
        "http://localhost:11434/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3.2:1b",
            stream: false,
            format: "json",
            messages: [
              {
                role: "system",
                content: `You explain ecommerce product recommendations.
Return ONLY JSON in this exact structure:
{"explanations":{"PRODUCT_ID":"Short explanation"}}
Use every supplied product ID as a string key.
Use the supplied reason to explain why the product was recommended.
Do not claim the customer likes a product unless the supplied reason supports it.
Do not invent product features or customer preferences.
Keep each explanation friendly and concise.`,
              },
              {
                role: "user",
                content: JSON.stringify({
                  products: products.map((product) => ({
                    id: String(product.id),
                    name: product.name,
                    categoryId: product.categoryId,
                    reason: product.reason,
                  })),
                }),
              },
            ],
            options: {
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}`);
      }

      const result = (await response.json()) as {
        message?: { content?: string };
      };

      const content = result.message?.content;

      if (!content) {
        return {};
      }

      const parsed = JSON.parse(content) as {
        explanations?: Record<string, unknown>;
      };

      const explanations: Record<string, string> = {};

      for (const product of products) {
        const explanation =
          parsed.explanations?.[String(product.id)];

        if (
          typeof explanation === "string" &&
          explanation.trim().length > 0
        ) {
          explanations[String(product.id)] = explanation.trim();
        }
      }

      return explanations;
    } catch (error) {
      console.error(
        "Ollama recommendation explanations failed:",
        error instanceof Error ? error.message : error,
      );

      // Ollama failure must not break product recommendations.
      return {};
    }
  }
}
