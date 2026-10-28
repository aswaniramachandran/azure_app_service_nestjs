import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Wishlist } from './wishlist.entity';
import { WishlistItem } from './wishlist-item.entity';

import { Product } from '../products/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,

    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepo: Repository<WishlistItem>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // Get customer's wishlist
  async getWishlist(userId: number) {
    let wishlist = await this.wishlistRepo.findOne({
      where: {
        userId,
      },
      relations: {
        items: {
          product: true,
        },
      },
    });

    // Create wishlist if customer doesn't have one
    if (!wishlist) {
      wishlist = await this.wishlistRepo.save({
        userId,
      });

      wishlist.items = [];
    }

    return this.buildWishlistResponse(wishlist);
  }

  // Add product to wishlist
  async addItem(
    userId: number,
    productId: number,
  ) {
    // Check product exists
    const product = await this.productRepo.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    // Find customer's wishlist
    let wishlist = await this.wishlistRepo.findOne({
      where: {
        userId,
      },
    });

    // Create wishlist if not exists
    if (!wishlist) {
      wishlist = await this.wishlistRepo.save({
        userId,
      });
    }

    // Check duplicate
    const existingItem =
      await this.wishlistItemRepo.findOne({
        where: {
          wishlistId: wishlist.id,
          productId,
        },
      });

    if (existingItem) {
      throw new BadRequestException(
        'Product already exists in wishlist',
      );
    }

    // Add item
    await this.wishlistItemRepo.save({
      wishlistId: wishlist.id,
      productId,
    });

    return this.getWishlist(userId);
  }

  // Remove one item
  async removeItem(
    userId: number,
    itemId: number,
  ) {
    const wishlist =
      await this.wishlistRepo.findOne({
        where: {
          userId,
        },
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Wishlist not found',
      );
    }

    const item =
      await this.wishlistItemRepo.findOne({
        where: {
          id: itemId,
          wishlistId: wishlist.id,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Wishlist item not found',
      );
    }

    await this.wishlistItemRepo.remove(item);

    return this.getWishlist(userId);
  }

  // Clear wishlist
  async clearWishlist(userId: number) {
    const wishlist =
      await this.wishlistRepo.findOne({
        where: {
          userId,
        },
      });

    if (!wishlist) {
      return {
        message: 'Wishlist is already empty',
      };
    }

    await this.wishlistItemRepo.delete({
      wishlistId: wishlist.id,
    });

    return {
      message: 'Wishlist cleared successfully',
    };
  }

  // Format response for customer UI
  private buildWishlistResponse(
    wishlist: Wishlist,
  ) {
    const items = wishlist.items ?? [];

    const formattedItems = items.map(
      (item) => ({
        id: item.id,

        productId: item.productId,

        name: item.product.name,

        price: Number(item.product.price),

        imageUrl: item.product.imageUrl,

        quantity:
          item.product.quantity,

        inStock:
          item.product.quantity > 0,
      }),
    );

    return {
      wishlistId: wishlist.id,

      totalItems: formattedItems.length,

      items: formattedItems,
    };
  }
}