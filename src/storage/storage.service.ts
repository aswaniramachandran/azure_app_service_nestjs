
import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { KeyVaultService } from '../key-vault/key-vault.service';

@Injectable()
export class StorageService {
  private blobServiceClient?: BlobServiceClient;

  constructor(
    private readonly keyVaultService: KeyVaultService,
  ) {}

  async initialize() {
    const accountName =
      process.env.AZURE_STORAGE_ACCOUNT_NAME;

    const accountKey =
      await this.keyVaultService.getSecret(
        'STORAGE-ACCOUNT-KEY',
      );

    if (!accountName) {
      throw new Error(
        'AZURE_STORAGE_ACCOUNT_NAME is not configured',
      );
    }

    if (!accountKey) {
      throw new Error(
        'STORAGE-ACCOUNT-KEY not found in Key Vault',
      );
    }

    const connectionString =
      `DefaultEndpointsProtocol=https;` +
      `AccountName=${accountName};` +
      `AccountKey=${accountKey};` +
      `EndpointSuffix=core.windows.net`;

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(
        connectionString,
      );
  }

  async uploadFile(file: any): Promise<string> {
    if (!this.blobServiceClient) {
      await this.initialize();
    }

    if (!this.blobServiceClient) {
      throw new Error(
        'BlobServiceClient is not initialized',
      );
    }

    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!containerName) {
      throw new Error(
        'AZURE_STORAGE_CONTAINER_NAME is not configured',
      );
    }

    const containerClient =
      this.blobServiceClient.getContainerClient(
        containerName,
      );

    const blobName =
      `${Date.now()}-${file.originalname}`;

    const blockBlobClient =
      containerClient.getBlockBlobClient(
        blobName,
      );

    await blockBlobClient.uploadData(
      file.buffer,
      {
        blobHTTPHeaders: {
          blobContentType: file.mimetype,
        },
      },
    );

    return blockBlobClient.url;
  }
}

