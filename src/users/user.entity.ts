// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
// } from 'typeorm';

// export enum UserRole {
//   USER = 'USER',
//   ADMIN = 'ADMIN',
// }

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn()
//   id!: number;

//   @Column()
//   name!: string;

//   @Column({ unique: true })
//   email!: string;

//   @Column()
//   password_hash!: string;

//   @Column({
//     type: 'enum',
//     enum: UserRole,
//     default: UserRole.USER,
//   })
//   role!: UserRole;

//   @CreateDateColumn()
//   created_at!: Date;
// }





import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Permission } from '../auth/permissions';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ type: 'simple-json', nullable: true })
  permissions!: Permission[] | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}