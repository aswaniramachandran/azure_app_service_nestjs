import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('order_live_locations')
export class OrderLiveLocation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  orderId!: number;

  @Column({ type: 'double precision' })
  latitude!: number;

  @Column({ type: 'double precision' })
  longitude!: number;

  @Column({ type: 'double precision', nullable: true })
  accuracy!: number | null;

  @Column({ type: 'double precision', nullable: true })
  speedMps!: number | null;

  @Column({ type: 'double precision', nullable: true })
  heading!: number | null;

  @Column({ type: 'varchar', nullable: true })
  locationName!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}