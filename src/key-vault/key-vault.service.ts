import { Injectable } from '@nestjs/common';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

@Injectable()
export class KeyVaultService {
  private readonly client: SecretClient;

  constructor() {
    const credential = new DefaultAzureCredential();

    this.client = new SecretClient(
      'https://aswani-product-keyvault.vault.azure.net/',
      credential,
    );
  }

  async getSecret(secretName: string): Promise<string | undefined> {
    const secret = await this.client.getSecret(secretName);

    return secret.value;
  }
}