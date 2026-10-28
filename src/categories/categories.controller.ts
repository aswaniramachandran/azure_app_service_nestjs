import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { CategoriesService } from "./categories.service";

import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { Permission } from "../auth/permissions";
import { SearchCategoriesDto } from "./dto/search-categories.dto";

const imageUpload = FileInterceptor("image", {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    const isValid = allowedTypes.includes(file.mimetype);

    cb(
      isValid
        ? null
        : new BadRequestException("Only JPG, PNG or WEBP images are allowed"),
      isValid,
    );
  },
});

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // CREATE CATEGORY
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  @UseInterceptors(imageUpload)
  create(
    @Body() body: CreateCategoryDto,
    // @UploadedFile() image: Express.Multer.File,
    @UploadedFile() image: any,
  ) {
    return this.categoriesService.create(body, image);
  }

  // GET ALL CATEGORIES
  @Get()
  findAll(@Query() query: SearchCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  // GET CATEGORY
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  // UPDATE CATEGORY
  @Patch(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  @UseInterceptors(imageUpload)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto,
    // @UploadedFile() image: Express.Multer.File,
    @UploadedFile() image: any,
  ) {
    return this.categoriesService.update(id, body, image);
  }

  // DELETE CATEGORY
  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
