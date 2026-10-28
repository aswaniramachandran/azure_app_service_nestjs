import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';

import { CartService } from './cart.service';

import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
  ) {}

  @Get()
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addItem(
    @Req() req: any,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(
      req.user.id,
      dto,
    );
  }

  @Patch('items/:id')
  updateItem(
    @Req() req: any,
    @Param('id', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      req.user.id,
      itemId,
      dto,
    );
  }

  @Delete('items/:id')
  removeItem(
    @Req() req: any,
    @Param('id', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.removeItem(
      req.user.id,
      itemId,
    );
  }

  @Delete()
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(
      req.user.id,
    );
  }
}