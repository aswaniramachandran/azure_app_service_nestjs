import { Test, TestingModule } from '@nestjs/testing';
import { KeyVaultController } from './key-vault.controller';

describe('KeyVaultController', () => {
  let controller: KeyVaultController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeyVaultController],
    }).compile();

    controller = module.get<KeyVaultController>(KeyVaultController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
