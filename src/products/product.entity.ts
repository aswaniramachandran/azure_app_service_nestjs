import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Category } from "../categories/category.entity";
import { Brand } from "../brands/brand.entity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  price!: number;

  @Column()
  quantity!: number;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ nullable: true })
  categoryId !: number | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category!: Category | null;



  @Column({ nullable: true })
  brandId !: number;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'brandId' })
  brand !: Brand;
}
