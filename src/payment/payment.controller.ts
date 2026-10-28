import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PaymentService } from './payment.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Get(':id')
  getPayment(
    @Req() req: any,
    @Param('id', ParseIntPipe)
    paymentId: number,
  ) {
    return this.paymentService.getPayment(
      req.user.id,
      paymentId,
    );
  }

  @Post(':id/demo/success')
  demoSuccess(
    @Req() req: any,
    @Param('id', ParseIntPipe)
    paymentId: number,
  ) {
    return this.paymentService.demoSuccess(
      req.user.id,
      paymentId,
    );
  }

  @Post(':id/demo/fail')
  demoFail(
    @Req() req: any,
    @Param('id', ParseIntPipe)
    paymentId: number,
  ) {
    return this.paymentService.demoFail(
      req.user.id,
      paymentId,
    );
  }
}