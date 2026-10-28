import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "../users/user.entity";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
  PAYMENT_PENDING = "payment_pending",
  PLACED = "placed",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  COD = "cod",
  CARD = "card",
  UPI = "upi",
  PAYPAL = "paypal",
  APPLE_PAY = "apple_pay",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
}
export enum ShippingMethod {
  STANDARD = "standard",
  EXPRESS = "express",
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  orderNumber!: string;

  @Column()
  userId!: number;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PLACED,
  })
  status!: OrderStatus;

  @Column({
    type: "enum",
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;
  
  @Column({
    type: "boolean",
    default: true,
  })
  stockDeducted!: boolean;

  @Column({
    type: "enum",
    enum: ShippingMethod,
  })
  shippingMethod!: ShippingMethod;

  // Shipping address snapshot
  @Column()
  fullName!: string;

  @Column()
  phoneNumber!: string;

  @Column()
  addressLine1!: string;

  @Column({
    type: "varchar",
    nullable: true,
  })
  addressLine2!: string | null;

  @Column()
  city!: string;

  @Column()
  pincode!: string;

  @Column()
  state!: string;

  @Column()
  country!: string;

  @Column({
    type: "int",
    default: 0,
  })
  subtotal!: number;

  @Column({
    type: "int",
    default: 0,
  })
  shippingFee!: number;

  @Column({
    type: "int",
    default: 0,
  })
  totalAmount!: number;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items!: OrderItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
