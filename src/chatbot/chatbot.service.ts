// import { Injectable, ServiceUnavailableException } from "@nestjs/common";
// import { HttpService } from "@nestjs/axios";
// import { ConfigService } from "@nestjs/config";
// import { firstValueFrom } from "rxjs";

// import { ProductsService } from "../products/products.service";
// import { OrdersService } from "../orders/orders.service";
// import { OrderTrackingService } from "../order-tracking/order-tracking.service";

// type ChatIntent = {
//   intent:
//     | "product_search"
//     | "order_history"
//     | "order_tracking"
//     | "return_policy"
//     | "general";
//   searchTerm?: string;
//   maxPrice?: number | null;
//   minPrice?: number | null;
//   inStockOnly?: boolean;
//   orderNumber?: string | null;
//   orderStatus?: string | null;
// };

// @Injectable()
// export class ChatbotService {
//   private readonly ollamaUrl = "http://localhost:11434/api/chat";
//   private readonly model = "llama3.2:1b";

//   constructor(
//     private readonly httpService: HttpService,
//     private readonly configService: ConfigService,
//     private readonly productsService: ProductsService,
//     private readonly ordersService: OrdersService,
//     private readonly trackingService: OrderTrackingService,
//   ) {}

//   async askCustomer(message: string, customerId: number) {
//     const question = message?.trim();

//     if (!question) {
//       return { answer: "Please enter a question." };
//     }

//     // Ask Ollama to identify what the customer wants.
//     const intent = await this.detectIntent(question);

//     switch (intent.intent) {
//       case "product_search":
//         return this.searchProducts(intent);

//       case "order_history":
//         return this.getOrderHistory(customerId, intent.orderStatus);

//       case "order_tracking":
//         return this.trackOrder(customerId, intent.orderNumber);

//       case "return_policy":
//         return this.getReturnPolicy();

//       default:
//         return this.askGeneralQuestion(question);
//     }
//   }

//   private async detectIntent(question: string): Promise<ChatIntent> {
//     const q = question.toLowerCase().trim();

//     // 1. Order history questions
//     // Order history questions with specific statuses
//     if (
//       /\b(my|show|list|view|check|find)\b.*\b(shipped|delivered|pending|confirmed|placed|cancelled|canceled|processing)\b.*\borders?\b/.test(
//         q,
//       ) ||
//       /\b(my|show|list|view|check|find)\b.*\borders?\b.*\b(shipped|delivered|pending|confirmed|placed|cancelled|canceled|processing)\b/.test(
//         q,
//       )
//     ) {
//       let orderStatus: string | null = null;

//       if (/\bshipped\b/.test(q)) orderStatus = "shipped";
//       else if (/\bdelivered\b/.test(q)) orderStatus = "delivered";
//       else if (/\bpending\b/.test(q)) orderStatus = "pending";
//       else if (/\bconfirmed\b/.test(q)) orderStatus = "confirmed";
//       else if (/\bplaced\b/.test(q)) orderStatus = "placed";
//       else if (/\bcancelled\b|\bcanceled\b/.test(q)) orderStatus = "cancelled";
//       else if (/\bprocessing\b/.test(q)) orderStatus = "processing";

//       return {
//         intent: "order_history",
//         orderStatus,
//       };
//     }

//     // General order history
//     if (
//       /\b(my orders|order history|show my orders|list my orders|view my orders)\b/.test(
//         q,
//       )
//     ) {
//       return {
//         intent: "order_history",
//         orderStatus: null,
//       };
//     }

//     // 2. Order tracking questions
//     if (
//       /\b(track my order|track order|where is my package|where's my package|where is my order|delivery status|tracking status|track my package)\b/.test(
//         q,
//       )
//     ) {
//       const orderNumberMatch = question.match(
//         /\b(?:order\s*#?\s*|order number\s*#?\s*)([a-zA-Z0-9-]+)\b/i,
//       );

//       return {
//         intent: "order_tracking",
//         orderNumber: orderNumberMatch?.[1] ?? null,
//       };
//     }

//     // 3. Return and refund questions
//     if (/\b(return|returns|refund|refunds|exchange|exchanges)\b/.test(q)) {
//       return {
//         intent: "return_policy",
//       };
//     }

//     // 4. Ask Ollama to classify other questions
//     const prompt = `
// Classify the customer's shopping question.
// Return ONLY one valid JSON object, without markdown.

// Allowed intents:
// - product_search: looking for products, names, prices, categories,
//   availability, stock, or product recommendations.
// - order_history: asking about past or current orders.
// - order_tracking: asking where a package is, delivery status, or tracking.
// - return_policy: asking about returns, refunds, or exchanges.
// - general: greetings or other questions.

// Important rules:
// - If the customer asks about their own orders, use order_history.
// - If the customer asks where a package is or wants to track a specific
//   order, use order_tracking.
// - Do not classify order questions as product_search.
// - Extract a product search term only for product_search.
// - If the customer asks for all products, use an empty searchTerm.
// - Extract minPrice/maxPrice only when the customer gives a price limit.
// - Set inStockOnly true only when explicitly requested.
// - Extract orderNumber only if explicitly mentioned.

// Expected JSON:
// {
//   "intent": "product_search",
//   "searchTerm": "lipstick",
//   "minPrice": null,
//   "maxPrice": 500,
//   "inStockOnly": true,
//   "orderNumber": null
// }

// Customer question: ${JSON.stringify(question)}
// `;

//     try {
//       const response = await firstValueFrom(
//         this.httpService.post(this.ollamaUrl, {
//           model: this.model,
//           stream: false,
//           format: "json",
//           messages: [
//             {
//               role: "system",
//               content:
//                 "Classify customer intent. Return only valid JSON matching the requested schema.",
//             },
//             {
//               role: "user",
//               content: prompt,
//             },
//           ],
//         }),
//       );

//       const content = response.data?.message?.content;

//       if (!content || typeof content !== "string") {
//         return { intent: "general" };
//       }

//       const parsed = JSON.parse(content) as ChatIntent;

//       const allowedIntents: ChatIntent["intent"][] = [
//         "product_search",
//         "order_history",
//         "order_tracking",
//         "return_policy",
//         "general",
//       ];

//       if (!allowedIntents.includes(parsed.intent)) {
//         return { intent: "general" };
//       }

//       return {
//         intent: parsed.intent,
//         searchTerm:
//           typeof parsed.searchTerm === "string"
//             ? parsed.searchTerm.trim().slice(0, 100)
//             : "",
//         minPrice: this.validPrice(parsed.minPrice),
//         maxPrice: this.validPrice(parsed.maxPrice),
//         inStockOnly: parsed.inStockOnly === true,
//         orderNumber:
//           typeof parsed.orderNumber === "string"
//             ? parsed.orderNumber.trim().slice(0, 100)
//             : null,
//       };
//     } catch {
//       throw new ServiceUnavailableException(
//         "The chatbot AI is unavailable. Please try again.",
//       );
//     }
//   }

//   private validPrice(value: unknown): number | null {
//     return typeof value === "number" && Number.isFinite(value) && value >= 0
//       ? value
//       : null;
//   }

//   private async searchProducts(intent: ChatIntent) {
//     const result = await this.productsService.findAll({
//       search: intent.searchTerm || undefined,
//       minPrice: intent.minPrice ?? undefined,
//       maxPrice: intent.maxPrice ?? undefined,
//       page: 1,
//       limit: 100,
//     } as any);

//     const rows = this.extractRows(result);

//     // Filter availability using real database quantities.
//     const products = intent.inStockOnly
//       ? rows.filter((product) => Number(product.quantity) > 0)
//       : rows;

//     if (products.length === 0) {
//       return {
//         answer: intent.searchTerm
//           ? `I couldn't find matching products for "${intent.searchTerm}". Please try another product name or price range.`
//           : "I could not find any matching products right now.",
//       };
//     }

//     const lines = products.slice(0, 10).map((product: any) => {
//       const stock =
//         Number(product.quantity) > 0
//           ? `In stock (${product.quantity})`
//           : "Out of stock";

//       return `• ${product.name} — Price: ₹${product.price} — ${stock}`;
//     });

//     return {
//       answer:
//         `Here are the matching products from our store:\n` +
//         lines.join("\n") +
//         (products.length > 10
//           ? "\nShowing the first 10 matching products."
//           : ""),
//     };
//   }

 
// private async getOrderHistory(
//   customerId: number,
//   status?: string | null,
// ) {
//   // Get only this customer's orders.
//   const query: any = {
//     page: 1,
//     limit: 20,
//   };

//   // Apply the status filter when the customer requests it.
//   if (status) {
//     query.status = status.toLowerCase();
//   }

//   const result = await this.ordersService.findMyOrders(
//     customerId,
//     query,
//   );

//   const orders = this.extractRows(result);

//   if (orders.length === 0) {
//     return {
//       answer: status
//         ? `You have no orders with status "${status}".`
//         : 'You have no orders yet.',
//     };
//   }

//   const lines = orders.map((order: any) => {
//     return (
//       `• Order ${order.orderNumber ?? order.id}` +
//       ` — Status: ${order.status}` +
//       ` — Total: ₹${order.totalAmount}`
//     );
//   });

//   return {
//     answer: status
//       ? `Here are your ${status} orders:\n${lines.join('\n')}`
//       : `Here is your recent order history:\n${lines.join('\n')}`,
//   };
// }


//   private async trackOrder(
//     customerId: number,
//     requestedOrderNumber?: string | null,
//   ) {
//     const result = await this.ordersService.findMyOrders(customerId, {
//       page: 1,
//       limit: 100,
//     } as any);

//     const orders = this.extractRows(result);

//     if (orders.length === 0) {
//       return { answer: "I could not find any orders on your account." };
//     }

//     const order = requestedOrderNumber
//       ? orders.find(
//           (item: any) =>
//             String(item.orderNumber).toLowerCase() ===
//             requestedOrderNumber.toLowerCase(),
//         )
//       : orders[0];

//     if (!order) {
//       return {
//         answer:
//           "I could not find that order in your recent orders. Please check the order number.",
//       };
//     }

//     // This service checks that the order belongs to this customer.
//     const tracking = await this.trackingService.getCustomerTracking(
//       Number(order.id),
//       customerId,
//     );

//     const current = tracking?.currentLocation;
//     const destination = tracking?.destination;

//     const locationText = current
//       ? `Current GPS location: ${current.latitude}, ${current.longitude}.`
//       : "A current GPS location is not available yet.";

//     const destinationText = destination?.address
//       ? `Delivery destination: ${destination.address}.`
//       : "";

//     return {
//       answer:
//         `Order ${order.orderNumber ?? order.id} status: ${order.status}. ` +
//         `${locationText} ${destinationText}`,
//     };
//   }

//   private getReturnPolicy() {
//     const policy = this.configService
//       .get<string>("STORE_RETURN_POLICY")
//       ?.trim();

//     if (policy) {
//       return { answer: policy };
//     }

//     return {
//       answer:
//         "For return or refund assistance, please visit the Returns section of our store or contact customer support. I do not have your store’s return policy configured yet.",
//     };
//   }

//   private async askGeneralQuestion(question: string) {
//     try {
//       const response = await firstValueFrom(
//         this.httpService.post(this.ollamaUrl, {
//           model: this.model,
//           stream: false,
//           messages: [
//             {
//               role: "system",
//               content:
//                 "You are a helpful e-commerce shopping assistant. " +
//                 "Answer general shopping questions clearly. " +
//                 "Never invent product prices, stock, customer orders, " +
//                 "tracking locations, or store policies. Those facts must " +
//                 "come from the store backend.",
//             },
//             { role: "user", content: question },
//           ],
//         }),
//       );

//       return {
//         answer:
//           response.data?.message?.content ??
//           "Sorry, I could not generate a response.",
//       };
//     } catch {
//       throw new ServiceUnavailableException(
//         "The chatbot AI is unavailable. Please try again.",
//       );
//     }
//   }

//   private extractRows(result: any): any[] {
//     if (Array.isArray(result)) return result;
//     if (Array.isArray(result?.data)) return result.data;
//     if (Array.isArray(result?.items)) return result.items;
//     return [];
//   }
// }


















import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { OrderTrackingService } from '../order-tracking/order-tracking.service';

type ChatIntent = {
  intent:
    | 'product_search'
    | 'order_history'
    | 'order_tracking'
    | 'return_policy'
    | 'general';

  searchTerm?: string;
  maxPrice?: number | null;
  minPrice?: number | null;
  inStockOnly?: boolean;
  outOfStockOnly?: boolean;
  orderNumber?: string | null;
  orderStatus?: string | null;
};

@Injectable()
export class ChatbotService {
  private readonly ollamaUrl = 'http://localhost:11434/api/chat';
  private readonly model = 'llama3.2:1b';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly trackingService: OrderTrackingService,
  ) {}

  async askCustomer(message: string, customerId: number) {
    const question = message?.trim();

    if (!question) {
      return { answer: 'Please enter a question.' };
    }

    const intent = await this.detectIntent(question);

    switch (intent.intent) {
      case 'product_search':
        return this.searchProducts(intent);

      case 'order_history':
        return this.getOrderHistory(
          customerId,
          intent.orderStatus,
        );

      case 'order_tracking':
        return this.trackOrder(
          customerId,
          intent.orderNumber,
        );

      case 'return_policy':
        return this.getReturnPolicy();

      default:
        return this.askGeneralQuestion(question);
    }
  }

  private async detectIntent(
    question: string,
  ): Promise<ChatIntent> {
    const q = question.toLowerCase().trim();

    // 1. Detect out-of-stock product questions directly.
    // Do this before calling Ollama so it cannot accidentally
    // reuse an unrelated product name such as "lipstick".
    if (
      /\b(out[\s-]+of[\s-]+stock|out[\s-]+of[\s-]+stock\s+products?|unavailable\s+products?|products?\s+unavailable)\b/.test(
        q,
      ) ||
      /\b(show|find|list|get)\b.*\b(unavailable|not available)\b/.test(
        q,
      )
    ) {
      return {
        intent: 'product_search',
        searchTerm: '',
        inStockOnly: false,
        outOfStockOnly: true,
      };
    }

    // 2. Detect in-stock product questions directly.
    if (
      /\b(in[\s-]+stock|available\s+products?|products?\s+available)\b/.test(
        q,
      ) ||
      /\b(show|find|list|get)\b.*\b(in stock|available products)\b/.test(
        q,
      )
    ) {
      return {
        intent: 'product_search',
        searchTerm: '',
        inStockOnly: true,
        outOfStockOnly: false,
      };
    }

    // 3. Detect order history with a requested status.
    const orderStatusPattern =
      /\b(shipped|delivered|pending|confirmed|placed|cancelled|canceled|processing)\b/;

    const asksForOrders =
      /\b(my|show|list|view|check|find|get)\b.*\borders?\b/.test(
        q,
      ) ||
      /\borders?\b.*\b(shipped|delivered|pending|confirmed|placed|cancelled|canceled|processing)\b/.test(
        q,
      );

    if (orderStatusPattern.test(q) && asksForOrders) {
      let orderStatus: string | null = null;

      if (/\bshipped\b/.test(q)) {
        orderStatus = 'shipped';
      } else if (/\bdelivered\b/.test(q)) {
        orderStatus = 'delivered';
      } else if (/\bpending\b/.test(q)) {
        orderStatus = 'pending';
      } else if (/\bconfirmed\b/.test(q)) {
        orderStatus = 'confirmed';
      } else if (/\bplaced\b/.test(q)) {
        orderStatus = 'placed';
      } else if (/\bcancelled\b|\bcanceled\b/.test(q)) {
        orderStatus = 'cancelled';
      } else if (/\bprocessing\b/.test(q)) {
        orderStatus = 'processing';
      }

      return {
        intent: 'order_history',
        orderStatus,
      };
    }

    // 4. General order history questions.
    if (
      /\b(my orders|all orders|show all orders|show all order|order history|show my orders|list my orders|view my orders|get my orders)\b/.test(
        q,
      )
    ) {
      return {
        intent: 'order_history',
        orderStatus: null,
      };
    }

    // 5. Order tracking questions.
    if (
      /\b(track my order|track order|where is my package|where's my package|where is my order|delivery status|tracking status|track my package|track my shipment|where is my shipment)\b/.test(
        q,
      )
    ) {
      const orderNumberMatch = question.match(
        /\b(?:order(?:\s+number)?\s*#?\s*)(ORD-[a-zA-Z0-9-]+|\d+)\b/i,
      );

      return {
        intent: 'order_tracking',
        orderNumber: orderNumberMatch?.[1] ?? null,
      };
    }

    // 6. Return and refund questions.
    if (
      /\b(return|returns|refund|refunds|exchange|exchanges)\b/.test(
        q,
      )
    ) {
      return {
        intent: 'return_policy',
      };
    }

    // 7. Ask Ollama to classify other questions.
    const prompt = `
Classify the customer's shopping question.

Return ONLY one valid JSON object, without markdown.

Allowed intents:
- product_search
- order_history
- order_tracking
- return_policy
- general

Rules:
- Product names, prices, categories, recommendations and stock questions
  use product_search.
- Questions about the customer's orders use order_history.
- Questions about package location or delivery tracking use order_tracking.
- Return, refund and exchange questions use return_policy.
- Greetings and other questions use general.
- Never invent product names.
- Extract a searchTerm only when the customer mentions a product or
  product category.
- For questions asking for all products, use an empty searchTerm.
- Extract minPrice and maxPrice only when the customer gives a price limit.
- Set inStockOnly to true only if the customer asks for in-stock products.
- Set outOfStockOnly to true only if the customer asks for out-of-stock
  products.
- Do not use an example product name when the customer did not mention it.
- Do not classify an order question as product_search.

Expected JSON:
{
  "intent": "product_search",
  "searchTerm": "",
  "minPrice": null,
  "maxPrice": null,
  "inStockOnly": false,
  "outOfStockOnly": false,
  "orderNumber": null,
  "orderStatus": null
}

Customer question: ${JSON.stringify(question)}
`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.ollamaUrl, {
          model: this.model,
          stream: false,
          format: 'json',
          messages: [
            {
              role: 'system',
              content:
                'Classify the customer question accurately. ' +
                'Return only valid JSON. Never copy a product name ' +
                'from an example unless the customer mentions it.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      );

      const content = response.data?.message?.content;

      if (!content || typeof content !== 'string') {
        return { intent: 'general' };
      }

      const parsed = JSON.parse(content) as ChatIntent;

      const allowedIntents: ChatIntent['intent'][] = [
        'product_search',
        'order_history',
        'order_tracking',
        'return_policy',
        'general',
      ];

      if (!allowedIntents.includes(parsed.intent)) {
        return { intent: 'general' };
      }

      return {
        intent: parsed.intent,
        searchTerm:
          typeof parsed.searchTerm === 'string'
            ? parsed.searchTerm.trim().slice(0, 100)
            : '',
        minPrice: this.validPrice(parsed.minPrice),
        maxPrice: this.validPrice(parsed.maxPrice),
        inStockOnly: parsed.inStockOnly === true,
        outOfStockOnly: parsed.outOfStockOnly === true,
        orderNumber:
          typeof parsed.orderNumber === 'string'
            ? parsed.orderNumber.trim().slice(0, 100)
            : null,
        orderStatus:
          typeof parsed.orderStatus === 'string'
            ? parsed.orderStatus.trim().toLowerCase()
            : null,
      };
    } catch {
      throw new ServiceUnavailableException(
        'The chatbot AI is unavailable. Please try again.',
      );
    }
  }

  private validPrice(value: unknown): number | null {
    return typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0
      ? value
      : null;
  }

  private async searchProducts(intent: ChatIntent) {
    const result = await this.productsService.findAll({
      search: intent.searchTerm || undefined,
      minPrice: intent.minPrice ?? undefined,
      maxPrice: intent.maxPrice ?? undefined,
      page: 1,
      limit: 100,
    } as any);

    const rows = this.extractRows(result);

    let products = rows;

    // Apply the requested stock filter to actual database quantities.
    if (intent.outOfStockOnly) {
      products = products.filter(
        (product: any) => Number(product.quantity) === 0,
      );
    } else if (intent.inStockOnly) {
      products = products.filter(
        (product: any) => Number(product.quantity) > 0,
      );
    }

    if (products.length === 0) {
      if (intent.outOfStockOnly) {
        return {
          answer: 'There are no out-of-stock products to show.',
        };
      }

      if (intent.inStockOnly) {
        return {
          answer: 'There are no in-stock products matching your request.',
        };
      }

      return {
        answer: intent.searchTerm
          ? `I couldn't find matching products for "${intent.searchTerm}". Please try another product name or price range.`
          : 'I could not find any matching products right now.',
      };
    }

    const lines = products
      .slice(0, 10)
      .map((product: any) => {
        const stock =
          Number(product.quantity) > 0
            ? `In stock (${product.quantity})`
            : 'Out of stock';

        return (
          `• ${product.name} — Price: ₹${product.price}` +
          ` — ${stock}`
        );
      });

    let heading = 'Here are the matching products from our store:';

    if (intent.outOfStockOnly) {
      heading = 'Here are the out-of-stock products:';
    } else if (intent.inStockOnly) {
      heading = 'Here are the in-stock products:';
    }

    return {
      answer:
        `${heading}\n` +
        lines.join('\n') +
        (products.length > 10
          ? '\nShowing the first 10 matching products.'
          : ''),
    };
  }

  private async getOrderHistory(
    customerId: number,
    status?: string | null,
  ) {
    const query: any = {
      page: 1,
      limit: 20,
    };

    if (status) {
      query.status = status.toLowerCase();
    }

    const result = await this.ordersService.findMyOrders(
      customerId,
      query,
    );

    const orders = this.extractRows(result);

    if (orders.length === 0) {
      return {
        answer: status
          ? `You have no orders with status "${status}".`
          : 'You have no orders yet.',
      };
    }

    const lines = orders.map((order: any) => {
      return (
        `• Order ${order.orderNumber ?? order.id}` +
        ` — Status: ${order.status}` +
        ` — Total: ₹${order.totalAmount}`
      );
    });

    return {
      answer: status
        ? `Here are your ${status} orders:\n${lines.join('\n')}`
        : `Here is your recent order history:\n${lines.join('\n')}`,
    };
  }

  private async trackOrder(
    customerId: number,
    requestedOrderNumber?: string | null,
  ) {
    const result = await this.ordersService.findMyOrders(
      customerId,
      {
        page: 1,
        limit: 100,
      } as any,
    );

    const orders = this.extractRows(result);

    if (orders.length === 0) {
      return {
        answer: 'I could not find any orders on your account.',
      };
    }

    const order = requestedOrderNumber
      ? orders.find(
          (item: any) =>
            String(item.orderNumber).toLowerCase() ===
            requestedOrderNumber.toLowerCase(),
        )
      : orders[0];

    if (!order) {
      return {
        answer:
          'I could not find that order in your recent orders. Please check the order number.',
      };
    }

    // This service verifies that the order belongs to the customer.
    const tracking = await this.trackingService.getCustomerTracking(
      Number(order.id),
      customerId,
    );

    const current = tracking?.currentLocation;
    const destination = tracking?.destination;

    const locationText = current
      ? `Current GPS location: ${current.latitude}, ${current.longitude}.`
      : 'A current GPS location is not available yet.';

    const destinationText = destination?.address
      ? `Delivery destination: ${destination.address}.`
      : '';

    return {
      answer:
        `Order ${order.orderNumber ?? order.id} status: ${order.status}. ` +
        `${locationText} ${destinationText}`,
    };
  }

  private getReturnPolicy() {
    const policy = this.configService
      .get<string>('STORE_RETURN_POLICY')
      ?.trim();

    if (policy) {
      return { answer: policy };
    }

    return {
      answer:
        'For return or refund assistance, please visit the Returns section of our store or contact customer support. I do not have your store’s return policy configured yet.',
    };
  }

  private async askGeneralQuestion(question: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.ollamaUrl, {
          model: this.model,
          stream: false,
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful e-commerce shopping assistant. ' +
                'Answer general shopping questions clearly. ' +
                'Never invent product prices, stock, customer orders, ' +
                'tracking locations, or store policies. Those facts ' +
                'must come from the store backend.',
            },
            {
              role: 'user',
              content: question,
            },
          ],
        }),
      );

      return {
        answer:
          response.data?.message?.content ??
          'Sorry, I could not generate a response.',
      };
    } catch {
      throw new ServiceUnavailableException(
        'The chatbot AI is unavailable. Please try again.',
      );
    }
  }

  private extractRows(result: any): any[] {
    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    if (Array.isArray(result?.items)) {
      return result.items;
    }

    return [];
  }
}
