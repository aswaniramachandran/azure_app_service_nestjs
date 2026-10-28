import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Column,
} from 'typeorm';

import { User } from '../users/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column({ unique: true })
  userId !: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user !: User;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
  })
  items !: CartItem[];
}