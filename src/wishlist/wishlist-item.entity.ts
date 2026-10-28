import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Wishlist } from './wishlist.entity';
import { Product } from '../products/product.entity';

@Entity('wishlist_items')
@Unique(['wishlistId', 'productId'])
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  wishlistId !: number;

  @Column()
  productId !: number;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'wishlistId' })
  wishlist !: Wishlist;

  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product !: Product;
}