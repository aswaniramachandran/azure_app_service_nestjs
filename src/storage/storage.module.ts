import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { KeyVaultModule } from '../key-vault/key-vault.module';

@Module({
  imports: [KeyVaultModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}