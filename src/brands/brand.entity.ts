import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Product, (product) => product.brand)
  products !: Product[];
}