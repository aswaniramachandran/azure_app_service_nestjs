import { Test, TestingModule } from '@nestjs/testing';
import { KeyVaultService } from './key-vault.service';

describe('KeyVaultService', () => {
  let service: KeyVaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeyVaultService],
    }).compile();

    service = module.get<KeyVaultService>(KeyVaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
