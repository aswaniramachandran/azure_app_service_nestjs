import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { OrderStatus } from '../orders/order.entity';

@Entity('order_tracking_history')
@Index(['orderId', 'createdAt'])
export class OrderTracking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orderId !: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  status!: OrderStatus;

  @Column({ type: 'varchar', nullable: true })
  message!: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}