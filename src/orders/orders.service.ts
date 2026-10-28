import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { Cart } from "../cart/cart.entity";
import { CartItem } from "../cart/cart-item.entity";
import { Product } from "../products/product.entity";

import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from "./order.entity";

import { OrderItem } from "./order-item.entity";
import { CreateOrderDto } from "./dto/create-order.dto";

import { Payment } from "../payment/payment.entity";
import { createPaginationResponse } from "../utils/response.util";
import { applyPagination } from "../utils/pagination.util";
import { applyFilters, QueryFilter } from "../utils/filter.util";
import { applySearch } from "../utils/search.util";
import { SearchOrdersDto } from "./dto/search-orders.dto";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,

    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    private readonly dataSource: DataSource,
  ) {}

  // =========================================================
  // CREATE ORDER
  // =========================================================

  async createOrder(
    userId: number,
    dto: CreateOrderDto,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        // -----------------------------------------------------
        // 1. Get customer's cart
        // -----------------------------------------------------
const cart = await manager.findOne(Cart, {
  where: {
    userId,
  },
  lock: {
    mode: "pessimistic_write",
  },
});

if (!cart) {
  throw new BadRequestException("Cart not found");
}

const cartItems = await manager.find(CartItem, {
  where: {
    cartId: cart.id,
  },
  relations: {
    product: true,
  },
});

if (cartItems.length === 0) {
  throw new BadRequestException("Cart is empty");
}

cart.items = cartItems;

        // -----------------------------------------------------
        // 2. Calculate shipping fee
        // -----------------------------------------------------

        const shippingFee =
          dto.shippingMethod ===
          ShippingMethod.EXPRESS
            ? 100
            : 0;

        let subtotal = 0;

        const orderItemsData: Array<{
          productId: number;
          productName: string;
          unitPrice: number;
          quantity: number;
          subtotal: number;
          imageUrl: string;
        }> = [];

        // -----------------------------------------------------
        // 3. Check stock + calculate totals
        // -----------------------------------------------------

        for (const cartItem of cart.items) {
          const product =
            await manager.findOne(Product, {
              where: {
                id: cartItem.productId,
              },

              lock: {
                mode: "pessimistic_write",
              },
            });

          if (!product) {
            throw new NotFoundException(
              `Product ${cartItem.productId} not found`,
            );
          }

          if (product.quantity <= 0) {
            throw new BadRequestException(
              `${product.name} is out of stock`,
            );
          }

          if (
            product.quantity <
            cartItem.quantity
          ) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
            );
          }

          const unitPrice =
            Number(product.price);

          const itemSubtotal =
            unitPrice *
            cartItem.quantity;

          subtotal += itemSubtotal;

          orderItemsData.push({
            productId: product.id,

            productName: product.name,

            unitPrice,

            quantity:
              cartItem.quantity,

            subtotal:
              itemSubtotal,

            imageUrl:
              product.imageUrl,
          });
        }

        // -----------------------------------------------------
        // 4. Calculate final amount
        // -----------------------------------------------------

        const totalAmount =
          subtotal + shippingFee;

        // -----------------------------------------------------
        // 5. Determine order status
        // -----------------------------------------------------

        const orderStatus =
          dto.paymentMethod ===
          PaymentMethod.COD
            ? OrderStatus.PLACED
            : OrderStatus.PAYMENT_PENDING;

        // -----------------------------------------------------
        // 6. Create order
        // -----------------------------------------------------

        const order =
          manager.create(Order, {
            orderNumber:
              this.generateOrderNumber(),

            userId,

            status: orderStatus,

            paymentMethod:
              dto.paymentMethod,

            paymentStatus:
              PaymentStatus.PENDING,

            shippingMethod:
              dto.shippingMethod,

            fullName:
              dto.fullName,

            phoneNumber:
              dto.phoneNumber,

            addressLine1:
              dto.addressLine1,

            addressLine2:
              dto.addressLine2 ||
              null,

            city:
              dto.city,

            pincode:
              dto.pincode,

            state:
              dto.state,

            country:
              dto.country,

            subtotal,

            shippingFee,

            totalAmount,

            // Stock will be reduced below
            stockDeducted: true,
          });

        const savedOrder =
          await manager.save(
            Order,
            order,
          );

        // -----------------------------------------------------
        // 7. Create order items
        // -----------------------------------------------------

        const orderItems =
          orderItemsData.map(
            (item) =>
              manager.create(
                OrderItem,
                {
                  orderId:
                    savedOrder.id,

                  productId:
                    item.productId,

                  productName:
                    item.productName,

                  unitPrice:
                    item.unitPrice,

                  quantity:
                    item.quantity,

                  subtotal:
                    item.subtotal,

                  imageUrl:
                    item.imageUrl,
                },
              ),
          );

        await manager.save(
          OrderItem,
          orderItems,
        );

        // -----------------------------------------------------
        // 8. Reduce product stock
        // -----------------------------------------------------

        for (const cartItem of cart.items) {
          const product =
            await manager.findOne(
              Product,
              {
                where: {
                  id:
                    cartItem.productId,
                },

                lock: {
                  mode:
                    "pessimistic_write",
                },
              },
            );

          if (!product) {
            throw new NotFoundException(
              `Product ${cartItem.productId} not found`,
            );
          }

          product.quantity -=
            cartItem.quantity;

          await manager.save(
            Product,
            product,
          );
        }

        // -----------------------------------------------------
        // 9. Create payment record
        // -----------------------------------------------------

        const payment =
          manager.create(
            Payment,
            {
              orderId:
                savedOrder.id,

              userId,

              method:
                dto.paymentMethod,

              amount:
                totalAmount,

              status:
                PaymentStatus.PENDING,

              transactionId:
                null,

              paidAt:
                null,
            },
          );

        await manager.save(
          Payment,
          payment,
        );

        // -----------------------------------------------------
        // 10. Clear cart
        // -----------------------------------------------------

        await manager.delete(
          CartItem,
          {
            cartId: cart.id,
          },
        );

        // -----------------------------------------------------
        // 11. Get final order
        // -----------------------------------------------------

        const finalOrder =
          await manager.findOne(
            Order,
            {
              where: {
                id:
                  savedOrder.id,
              },

              relations: {
                items: true,
              },
            },
          );

        if (!finalOrder) {
          throw new NotFoundException(
            "Order could not be loaded",
          );
        }

        // -----------------------------------------------------
        // 12. Return order + payment
        // -----------------------------------------------------

        return {
          ...finalOrder,

          payment: {
            id: payment.id,

            method:
              payment.method,

            amount:
              payment.amount,

            status:
              payment.status,

            transactionId:
              payment.transactionId,
          },
        };
      },
    );
  }

  // =========================================================
  // GET MY ORDERS
  // =========================================================
async findMyOrders(
  userId: number,
  query: SearchOrdersDto = {},
) {
  const qb = this.orderRepo
    .createQueryBuilder("o")
    .leftJoinAndSelect(
      "o.items",
      "item",
    )
    .where("o.userId = :userId", {
      userId,
    });

  // Search
  applySearch(qb, query, [
    "o.orderNumber",
    "item.productName",
    "o.fullName",
  ]);

  // Filters
  const filters: QueryFilter[] = [];

  if (
    query.status &&
    query.status !== "all"
  ) {
    filters.push({
      field: "o.status",
      operator: "=",
      value: query.status,
    });
  }

  applyFilters(qb, filters);

  // Pagination
  applyPagination(qb, query);

  qb
    .orderBy(
      "o.createdAt",
      "DESC",
    )
    .distinct(true);

  const [orders, total] =
    await qb.getManyAndCount();

  return createPaginationResponse(
    orders,
    total,
    query,
  );
}

  // =========================================================
  // GET ONE MY ORDER
  // =========================================================

  async findMyOrder(
    userId: number,
    orderId: number,
  ) {
    const order =
      await this.orderRepo.findOne({
        where: {
          id: orderId,

          userId,
        },

        relations: {
          items: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        "Order not found",
      );
    }

    return order;
  }

  // =========================================================
  // CANCEL ORDER
  // =========================================================

  async cancelOrder(
    userId: number,
    orderId: number,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const order =
          await manager.findOne(
            Order,
            {
              where: {
                id: orderId,

                userId,
              },

              relations: {
                items: true,
              },

              lock: {
                mode:
                  "pessimistic_write",
              },
            },
          );

        if (!order) {
          throw new NotFoundException(
            "Order not found",
          );
        }

        // -----------------------------------------------------
        // Only these orders can be cancelled
        // -----------------------------------------------------

        if (
          order.status !==
            OrderStatus.PLACED &&
          order.status !==
            OrderStatus.CONFIRMED &&
          order.status !==
            OrderStatus.PAYMENT_PENDING
        ) {
          throw new BadRequestException(
            "This order cannot be cancelled",
          );
        }

        // -----------------------------------------------------
        // Restore stock only if it was deducted
        // -----------------------------------------------------

        if (order.stockDeducted) {
          for (const item of order.items) {
            if (!item.productId) {
              continue;
            }

            const product =
              await manager.findOne(
                Product,
                {
                  where: {
                    id:
                      item.productId,
                  },

                  lock: {
                    mode:
                      "pessimistic_write",
                  },
                },
              );

            if (product) {
              product.quantity +=
                item.quantity;

              await manager.save(
                Product,
                product,
              );
            }
          }

          order.stockDeducted =
            false;
        }

        // -----------------------------------------------------
        // Cancel payment if payment is pending
        // -----------------------------------------------------

        const payment =
          await manager.findOne(
            Payment,
            {
              where: {
                orderId:
                  order.id,
              },
            },
          );

        if (
          payment &&
          payment.status ===
            PaymentStatus.PENDING
        ) {
          payment.status =
            PaymentStatus.FAILED;

          await manager.save(
            Payment,
            payment,
          );

          order.paymentStatus =
            PaymentStatus.FAILED;
        }

        // -----------------------------------------------------
        // Cancel order
        // -----------------------------------------------------

        order.status =
          OrderStatus.CANCELLED;

        await manager.save(
          Order,
          order,
        );

        return order;
      },
    );
  }

  // =========================================================
  // ORDER NUMBER
  // =========================================================

  private generateOrderNumber(): string {
    const timestamp =
      Date.now();

    const random =
      Math.floor(
        1000 +
          Math.random() * 9000,
      );

    return `ORD-${timestamp}-${random}`;
  }


}