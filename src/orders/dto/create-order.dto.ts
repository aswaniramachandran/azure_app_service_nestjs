import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  PaymentMethod,
  ShippingMethod,
} from '../order.entity';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName !: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber !: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine1 !: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city !: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  pincode !: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state !: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country !: string;

  @IsEnum(ShippingMethod)
  shippingMethod !: ShippingMethod;

  @IsEnum(PaymentMethod)
  paymentMethod !: PaymentMethod;
}