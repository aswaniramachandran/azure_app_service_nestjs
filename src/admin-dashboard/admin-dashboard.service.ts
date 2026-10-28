import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { User, UserRole } from '../users/user.entity';
import { DashboardQueryDto } from './dashboard-query.dto';

interface DateRange {
  from: string;
  to: string;
  start: Date;
  endExclusive: Date;
  days: number;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getSummary(query: DashboardQueryDto) {
    const range = this.getDateRange(query);
    const previousRange = this.getPreviousRange(range);

    const [totalRevenue, orderCount, ordersInRange, previousRevenue, previousOrderCount, productCount, customerCount] =
      await Promise.all([
        this.sumRevenue(range),
        this.orderRepository.count(),
        this.getOrderCount(range),
        this.sumRevenue(previousRange),
        this.getOrderCount(previousRange),
        this.productRepository.count(),
        this.userRepository.count({ where: { role: UserRole.USER } }),
      ]);

    return {
      range: { from: range.from, to: range.to },
      totalRevenue,
      orderCount,
      ordersInRange,
      previousRevenue,
      previousOrderCount,
      productCount,
      customerCount,
    };
  }

  async getRevenue(query: DashboardQueryDto) {
    const range = this.getDateRange(query);
    const rows = await this.orderRepository
      .createQueryBuilder('orders')
      .select(`TO_CHAR(orders.createdAt, 'YYYY-MM-DD')`, 'day')
      .addSelect('COALESCE(SUM(orders.totalAmount), 0)', 'revenue')
      .where('orders.createdAt >= :start', { start: range.start })
      .andWhere('orders.createdAt < :endExclusive', {
        endExclusive: range.endExclusive,
      })
      .andWhere('orders.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.PAID,
      })
      .andWhere('orders.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy(`TO_CHAR(orders.createdAt, 'YYYY-MM-DD')`)
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; revenue: string }>();

    const revenueByDay = new Map(
      rows.map((row) => [row.day, Number(row.revenue) || 0]),
    );
    const days = Array.from({ length: range.days }, (_, index) => {
      const date = new Date(range.start);
      date.setUTCDate(date.getUTCDate() + index);
      const day = date.toISOString().slice(0, 10);
      return { day, revenue: revenueByDay.get(day) ?? 0 };
    });

    return { range: { from: range.from, to: range.to }, days };
  }

  async getOrderStatuses() {
    const rows = await this.orderRepository
      .createQueryBuilder('orders')
      .select('orders.status', 'status')
      .addSelect('COUNT(orders.id)', 'count')
      .groupBy('orders.status')
      .getRawMany<{ status: OrderStatus; count: string }>();

    return {
      statuses: rows.map(({ status, count }) => ({
        status,
        count: Number(count),
      })),
      total: rows.reduce((total, row) => total + Number(row.count), 0),
    };
  }

  async getRecentOrders(query: DashboardQueryDto) {
    const orders = await this.orderRepository.find({
      relations: { user: true, items: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: query.limit ?? 5,
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.user?.name ?? order.fullName,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
      })),
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      status: order.status,
      createdAt: order.createdAt,
    }));
  }

  async getLowStock(query: DashboardQueryDto) {
    const threshold = query.threshold ?? 5;
    const products = await this.productRepository.find({
      where: { quantity: LessThanOrEqual(threshold) },
      relations: { category: true },
      order: { quantity: 'ASC', id: 'ASC' },
      take: query.limit ?? 5,
    });

    return {
      threshold,
      products: products.map((product) => this.toInventoryProduct(product, threshold)),
    };
  }

  async getInventory(query: DashboardQueryDto) {
    const threshold = query.threshold ?? 5;
    const products = await this.productRepository.find({
      relations: { category: true },
      order: { quantity: 'ASC', id: 'ASC' },
      take: query.limit ?? 4,
    });

    return {
      threshold,
      products: products.map((product) => this.toInventoryProduct(product, threshold)),
    };
  }

  private async sumRevenue(range: DateRange): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('orders')
      .select('COALESCE(SUM(orders.totalAmount), 0)', 'revenue')
      .where('orders.createdAt >= :start', { start: range.start })
      .andWhere('orders.createdAt < :endExclusive', {
        endExclusive: range.endExclusive,
      })
      .andWhere('orders.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.PAID,
      })
      .andWhere('orders.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .getRawOne<{ revenue: string }>();

    return Number(result?.revenue) || 0;
  }

  private getOrderCount(range: DateRange): Promise<number> {
    return this.orderRepository
      .createQueryBuilder('orders')
      .where('orders.createdAt >= :start', { start: range.start })
      .andWhere('orders.createdAt < :endExclusive', {
        endExclusive: range.endExclusive,
      })
      .getCount();
  }

  private getDateRange(query: DashboardQueryDto): DateRange {
    const now = new Date();
    const defaultTo = now.toISOString().slice(0, 10);
    const defaultFromDate = new Date(now);
    defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 6);

    const from = query.from ?? defaultFromDate.toISOString().slice(0, 10);
    const to = query.to ?? defaultTo;
    const start = this.parseUtcDate(from);
    const end = this.parseUtcDate(to);

    if (!start || !end || start > end) {
      throw new BadRequestException('A valid from/to date range is required.');
    }

    const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (days > 366) {
      throw new BadRequestException('Date ranges cannot exceed 366 days.');
    }

    const endExclusive = new Date(end);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    return { from, to, start, endExclusive, days };
  }

  private parseUtcDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return date.toISOString().slice(0, 10) === value ? date : null;
  }

  private getPreviousRange(range: DateRange): DateRange {
    const start = new Date(range.start);
    start.setUTCDate(start.getUTCDate() - range.days);
    const end = new Date(range.start);
    end.setUTCDate(end.getUTCDate() - 1);
    const endExclusive = new Date(range.start);

    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      start,
      endExclusive,
      days: range.days,
    };
  }

  private toInventoryProduct(product: Product, threshold: number) {
    return {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      quantity: product.quantity,
      threshold,
      categoryName: product.category?.name ?? null,
    };
  }
}
