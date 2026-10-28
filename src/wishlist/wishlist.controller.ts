import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { WishlistService } from './wishlist.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
  ) {}

  @Get()
  getWishlist(@Req() req: any) {
    return this.wishlistService.getWishlist(
      req.user.id,
    );
  }

  @Post('items/:productId')
  addItem(
    @Req() req: any,
    @Param(
      'productId',
      ParseIntPipe,
    )
    productId: number,
  ) {
    return this.wishlistService.addItem(
      req.user.id,
      productId,
    );
  }

  @Delete('items/:id')
  removeItem(
    @Req() req: any,
    @Param('id', ParseIntPipe)
    itemId: number,
  ) {
    return this.wishlistService.removeItem(
      req.user.id,
      itemId,
    );
  }

  @Delete()
  clearWishlist(@Req() req: any) {
    return this.wishlistService.clearWishlist(
      req.user.id,
    );
  }
}