import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: number | string;
    userId?: number | string;
    sub?: number | string;
  };
}

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('for-me')
  async getForMe(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const rawUserId =
      req.user?.userId ?? req.user?.id ?? req.user?.sub;

    const userId = Number(rawUserId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedException(
        'Authenticated user ID is missing or invalid',
      );
    }

    return this.recommendationsService.getForUser(
      userId,
      Number(limit) || 8,
    );
  }

  @Get('products/:productId')
  async getForProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('limit') limit?: string,
  ) {
    const recommendations = await this.recommendationsService.getForProduct(
      productId,
      Number(limit) || 8,
    );

    if (!recommendations) {
      throw new NotFoundException(`Product ${productId} was not found.`);
    }

    return recommendations;
  }
}