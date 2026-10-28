import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { randomUUID } from 'crypto';

import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../orders/order.entity';

import { OrderItem } from '../orders/order-item.entity';

import { Product } from '../products/product.entity';

import { Payment } from './payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    private readonly dataSource: DataSource,
  ) {}

  async getPayment(
    userId: number,
    paymentId: number,
  ) {
    const payment =
      await this.paymentRepo.findOne({
        where: {
          id: paymentId,
          userId,
        },
        relations: {
          order: true,
        },
      });

    if (!payment) {
      throw new NotFoundException(
        'Payment not found',
      );
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
    };
  }

  // Dummy online payment success
  async demoSuccess(
    userId: number,
    paymentId: number,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const payment =
          await manager.findOne(Payment, {
            where: {
              id: paymentId,
              userId,
            },
          });

        if (!payment) {
          throw new NotFoundException(
            'Payment not found',
          );
        }

        if (
          payment.method === PaymentMethod.COD
        ) {
          throw new BadRequestException(
            'COD does not use online payment',
          );
        }

        if (
          payment.status !==
          PaymentStatus.PENDING
        ) {
          throw new BadRequestException(
            'Payment is already processed',
          );
        }

        const order =
          await manager.findOne(Order, {
            where: {
              id: payment.orderId,
              userId,
            },
            relations: {
              items: true,
            },
          });

        if (!order) {
          throw new NotFoundException(
            'Order not found',
          );
        }

        if (
          order.status !==
          OrderStatus.PAYMENT_PENDING
        ) {
          throw new BadRequestException(
            'Order is not waiting for payment',
          );
        }

        payment.status =
          PaymentStatus.PAID;

        payment.transactionId =
          `DEMO-${randomUUID()}`;

        payment.paidAt = new Date();

        order.status =
          OrderStatus.PLACED;

        order.paymentStatus =
          PaymentStatus.PAID;

        await manager.save(
          Payment,
          payment,
        );

        await manager.save(
          Order,
          order,
        );

        return {
          message:
            'Dummy payment successful',

          paymentId: payment.id,

          orderId: order.id,

          orderNumber:
            order.orderNumber,

          transactionId:
            payment.transactionId,

          amount: payment.amount,

          paymentStatus:
            payment.status,

          orderStatus:
            order.status,
        };
      },
    );
  }

  // Dummy online payment failure
  async demoFail(
    userId: number,
    paymentId: number,
  ) {
    return this.dataSource.transaction(
      async (manager) => {
        const payment =
          await manager.findOne(Payment, {
            where: {
              id: paymentId,
              userId,
            },
          });

        if (!payment) {
          throw new NotFoundException(
            'Payment not found',
          );
        }

        if (
          payment.method === PaymentMethod.COD
        ) {
          throw new BadRequestException(
            'COD does not use online payment',
          );
        }

        if (
          payment.status !==
          PaymentStatus.PENDING
        ) {
          throw new BadRequestException(
            'Payment is already processed',
          );
        }

        const order =
          await manager.findOne(Order, {
            where: {
              id: payment.orderId,
              userId,
            },
            relations: {
              items: true,
            },
          });

        if (!order) {
          throw new NotFoundException(
            'Order not found',
          );
        }

        // Restore stock only once
        if (order.stockDeducted) {
          for (const item of order.items) {
            if (!item.productId) {
              continue;
            }

            const product =
              await manager.findOne(Product, {
                where: {
                  id: item.productId,
                },
              });

            if (product) {
              product.quantity +=
                item.quantity;

              await manager.save(
                Product,
                product,
              );
            }
          }

          order.stockDeducted = false;
        }

        payment.status =
          PaymentStatus.FAILED;

        order.status =
          OrderStatus.CANCELLED;

        order.paymentStatus =
          PaymentStatus.FAILED;

        await manager.save(
          Payment,
          payment,
        );

        await manager.save(
          Order,
          order,
        );

        return {
          message:
            'Dummy payment failed',

          paymentId: payment.id,

          orderId: order.id,

          paymentStatus:
            payment.status,

          orderStatus:
            order.status,
        };
      },
    );
  }
}