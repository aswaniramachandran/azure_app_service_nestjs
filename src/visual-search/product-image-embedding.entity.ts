
import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Product } from '../products/product.entity';

@Entity('product_image_embeddings')
export class ProductImageEmbedding {
  @PrimaryColumn({ type: 'integer', name: 'product_id' })
  productId!: number;

  @OneToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product!: Product;

  @Column({
    type: 'vector',
    length: 512,
    nullable: false,
  })
  embedding!: number[];

  @Column({
    type: 'varchar',
    length: 150,
    name: 'model_name',
  })
  modelName!: string;

  @Column({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'NOW()',
  })
  createdAt!: Date;
}
