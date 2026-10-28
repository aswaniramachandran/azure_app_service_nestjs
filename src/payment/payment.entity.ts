import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Order, PaymentMethod, PaymentStatus } from '../orders/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column({ unique: true })
  orderId ! : number;

  @ManyToOne(() => Order, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order !: Order;

  @Column()
  userId !: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method !: PaymentMethod;

  @Column({
    type: 'int',
  })
  amount !: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status !: PaymentStatus;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  transactionId !: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paidAt !: Date | null;

  @CreateDateColumn()
  createdAt !: Date;

  @UpdateDateColumn()
  updatedAt !: Date;
}