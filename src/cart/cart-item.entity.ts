import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Cart } from './cart.entity';
import { Product } from '../products/product.entity';

@Entity('cart_items')
@Unique(['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column()
  cartId !: number;

  @Column()
  productId !: number;

  @Column({ type: 'int' })
  quantity !: number;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart !: Cart;

  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product !: Product;
}