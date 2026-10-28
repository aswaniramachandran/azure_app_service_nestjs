
import { CreateBrandDto } from './create-brand.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}