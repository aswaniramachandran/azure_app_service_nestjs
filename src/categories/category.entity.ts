import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from '../products/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id !: number;

  @Column({ unique: true })
  name  !: string;

  @Column({ type: 'text', nullable: true })
  description  !: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl !: string | null;

 @OneToMany(() => Product, (product) => product.category)
  products !: Product[];

  @CreateDateColumn()
  createdAt  !: Date;

  @UpdateDateColumn()
  updatedAt  !: Date;

}