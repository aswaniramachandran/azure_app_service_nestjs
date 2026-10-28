import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';

import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // Get customer's cart
  async getCart(userId: number) {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: {
        items: {
          product: true,
        },
      },
    });

    // Create empty cart if customer doesn't have one
    if (!cart) {
      cart = await this.cartRepo.save({
        userId,
      });

      cart.items = [];
    }

    return this.buildCartResponse(cart);
  }

  // Add product to cart
  async addItem(userId: number, dto: AddCartItemDto) {
    const product = await this.productRepo.findOne({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.quantity <= 0) {
      throw new BadRequestException('Product is out of stock');
    }

    if (dto.quantity > product.quantity) {
      throw new BadRequestException(
        `Only ${product.quantity} units are available`,
      );
    }

    let cart = await this.cartRepo.findOne({
      where: { userId },
    });

    if (!cart) {
      cart = await this.cartRepo.save({
        userId,
      });
    }

    let cartItem = await this.cartItemRepo.findOne({
      where: {
        cartId: cart.id,
        productId: product.id,
      },
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity + dto.quantity;

      if (newQuantity > product.quantity) {
        throw new BadRequestException(
          `Only ${product.quantity} units are available`,
        );
      }

      cartItem.quantity = newQuantity;

      await this.cartItemRepo.save(cartItem);
    } else {
      cartItem = await this.cartItemRepo.save({
        cartId: cart.id,
        productId: product.id,
        quantity: dto.quantity,
      });
    }

    return this.getCart(userId);
  }

  // Update cart item quantity
  async updateItem(
    userId: number,
    itemId: number,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.cartRepo.findOne({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.cartItemRepo.findOne({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      relations: {
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity > item.product.quantity) {
      throw new BadRequestException(
        `Only ${item.product.quantity} units are available`,
      );
    }

    item.quantity = dto.quantity;

    await this.cartItemRepo.save(item);

    return this.getCart(userId);
  }

  // Remove one item
  async removeItem(userId: number, itemId: number) {
    const cart = await this.cartRepo.findOne({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.cartItemRepo.findOne({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepo.remove(item);

    return this.getCart(userId);
  }

  // Clear entire cart
  async clearCart(userId: number) {
    const cart = await this.cartRepo.findOne({
      where: { userId },
    });

    if (!cart) {
      return {
        message: 'Cart is already empty',
      };
    }

    await this.cartItemRepo.delete({
      cartId: cart.id,
    });

    return {
      message: 'Cart cleared successfully',
    };
  }

  // Build customer-friendly cart response
  private buildCartResponse(cart: Cart) {
    const items = cart.items ?? [];

    const formattedItems = items.map((item) => ({
      id: item.id,

      productId: item.productId,

      name: item.product.name,

      price: Number(item.product.price),

      quantity: item.quantity,

      imageUrl: item.product.imageUrl,

      subtotal:
        Number(item.product.price) * item.quantity,
    }));

    const totalItems = formattedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const totalAmount = formattedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    return {
      cartId: cart.id,
      items: formattedItems,
      totalItems,
      totalAmount,
    };
  }
}