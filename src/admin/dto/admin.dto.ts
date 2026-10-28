import { IsArray, IsEmail, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Permission, ROLE_PRESETS } from '../../auth/permissions';

export class CreateAdminDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(10) password!: string;

  @IsOptional() @IsIn(Object.keys(ROLE_PRESETS)) preset?: string;
  @IsOptional() @IsArray() @IsEnum(Permission, { each: true }) permissions?: Permission[];
}

export class UpdatePermissionsDto {
  @IsArray() @IsEnum(Permission, { each: true }) permissions!: Permission[];
}