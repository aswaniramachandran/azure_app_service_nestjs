
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from '../orders/order.entity';
import { SearchOrdersDto } from '../orders/dto/search-orders.dto';
import { applySearch } from '../utils/search.util';
import { applyFilters, QueryFilter } from '../utils/filter.util';
import { applyPagination } from '../utils/pagination.util';
import { createPaginationResponse } from '../utils/response.util';
import { OrderTrackingService } from '../order-tracking/order-tracking.service';

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    private readonly orderTrackingService: OrderTrackingService,
  ) {}

  async findAllOrders(query: SearchOrdersDto = {}) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'item')
      .leftJoinAndSelect('o.user', 'user');

    applySearch(qb, query, [
      'o.orderNumber',
      'item.productName',
      'o.fullName',
      'user.name',
      'user.email',
    ]);

    const filters: QueryFilter[] = [];

    if (query.status && query.status !== 'all') {
      filters.push({
        field: 'o.status',
        operator: '=',
        value: query.status,
      });
    }

    applyFilters(qb, filters);
    applyPagination(qb, query);

    qb.orderBy('o.createdAt', 'DESC').distinct(true);

    const [orders, total] = await qb.getManyAndCount();

    return createPaginationResponse(orders, total, query);
  }

  async updateStatus(orderId: number, status: OrderStatus) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status === OrderStatus.CANCELLED &&
      status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cancelled order cannot be reopened',
      );
    }

    const previousStatus = order.status;

    // Do not create duplicate tracking events.
    if (previousStatus === status) {
      return order;
    }

    // Update the order status.
    order.status = status;

    const savedOrder = await this.orderRepo.save(order);

    // Save the status change in tracking history.
    await this.orderTrackingService.recordEvent(
      savedOrder.id,
      savedOrder.status,
      `Order status changed from ${previousStatus} to ${savedOrder.status}`,
    );

    return savedOrder;
  }
}
