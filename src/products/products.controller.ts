

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  Query,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { ProductsService } from "./products.service";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { Permission } from "../auth/permissions";
import { SearchProductsDto } from "./dto/search-products.dto";

// Shared upload rules for create and update
const imageUpload = FileInterceptor("image", {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(
      file.mimetype,
    );
    cb(
      ok ? null : new BadRequestException("Only JPG, PNG or WEBP allowed"),
      ok,
    );
  },
});

@Controller("products")
export class ProductsController {
  constructor(private service: ProductsService) {}

  // ADMIN: CREATE PRODUCT
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  @UseInterceptors(imageUpload)
  create(@Body() body: any, @UploadedFile() image: any) {
    return this.service.create(body, image);
  }

  // PUBLIC: GET ALL PRODUCTS
  // @Get()
  // findAll() {
  //   return this.service.findAll();
  // }

   @Get()
  findAll(@Query() query: SearchProductsDto) {
    return this.service.findAll(query);
  }
  // PUBLIC: GET ONE PRODUCT
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // ADMIN: UPDATE PRODUCT
  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  @UseInterceptors(imageUpload)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() image: any,
  ) {
    return this.service.update(id, body, image);
  }

  // ADMIN: DELETE PRODUCT
  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  delete(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // Search

 
}
