import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from './order.entity';
import { Product } from '../products/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column()
  orderId !: number;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order !: Order;

  @Column({ nullable: true })
  productId !: number | null;

  @ManyToOne(() => Product, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'productId' })
  product !: Product | null;

  // Save product details at time of order
  @Column()
  productName !: string;

  @Column({
    type: 'int',
  })
  unitPrice !: number;

  @Column({
    type: 'int',
  })
  quantity !: number;

  @Column({
    type: 'int',
  })
  subtotal !: number;

  @Column({ nullable: true })
  imageUrl !: string;
}