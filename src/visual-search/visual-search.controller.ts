
import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { VisualSearchService } from './visual-search.service';

@Controller('visual-search')
export class VisualSearchController {
  constructor(
    private readonly visualSearchService: VisualSearchService,
  ) {}

  @Get('health')
  checkHealth() {
    return this.visualSearchService.checkAiHealth();
  }

  @Post('index/:productId')
  indexProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.visualSearchService.indexProductImage(productId);
  }

  @Post('search')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPEG, PNG and WEBP images are supported',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  searchByImage(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        'Please upload an image using the image field',
      );
    }

    return this.visualSearchService.searchByImage(file);
  }
}
