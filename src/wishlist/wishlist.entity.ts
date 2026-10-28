import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { WishlistItem } from './wishlist-item.entity';

@Entity('wishlists')
export class Wishlist {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column({ unique: true })
  userId !: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user  !: User;

  @OneToMany(() => WishlistItem, (item) => item.wishlist, {
    cascade: true,
  })
  items !: WishlistItem[];
}