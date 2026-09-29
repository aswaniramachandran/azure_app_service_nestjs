import { Controller, Get } from '@nestjs/common';
import { KeyVaultService } from './key-vault.service';

@Controller('key-vault')
export class KeyVaultController {
  constructor(private readonly keyVaultService: KeyVaultService) {}

  @Get('test')
  async testKeyVault() {
    const secret = await this.keyVaultService.getSecret('JWT-SECRET');

    return {
      keyVaultConnected: !!secret,
    };
  }
}