import { IsString, IsNumber, IsOptional, IsInt, Min } from "class-validator";

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
  
 


 
}
