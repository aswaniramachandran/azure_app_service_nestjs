import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { SearchOrdersDto } from './dto/search-orders.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  createOrder(
    @Req() req: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(
      req.user.id,
      dto,
    );
  }

  @Get()
  findMyOrders(
    @Req() req: any,
    @Query() query: SearchOrdersDto,
  ) {
    return this.ordersService.findMyOrders(
      req.user.id,
      query,
    );
  }

  @Get(':id')
  findMyOrder(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findMyOrder(
      req.user.id,
      id,
    );
  }

  @Patch(':id/cancel')
  cancelOrder(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.cancelOrder(
      req.user.id,
      id,
    );
  }
}