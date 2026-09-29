import { Module } from '@nestjs/common';
import { KeyVaultService } from './key-vault.service';
import { KeyVaultController } from './key-vault.controller';

@Module({

  providers: [KeyVaultService],
  exports: [KeyVaultService],
  controllers: [KeyVaultController],
})
export class KeyVaultModule {}