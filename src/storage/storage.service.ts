

import { Injectable } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { KeyVaultService } from '../key-vault/key-vault.service';

@Injectable()
export class StorageService {
  private blobServiceClient?: BlobServiceClient;

  constructor(private readonly keyVaultService: KeyVaultService) {}

async initialize() {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

  const accountKey = await this.keyVaultService.getSecret(
    'AZURE-STORAGE-ACCOUNT-KEY',
  );

  if (!accountName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME is not configured');
  }

  if (!accountKey) {
    throw new Error(
      'AZURE-STORAGE-ACCOUNT-KEY not found in Key Vault',
    );
  }

  const connectionString =
    `DefaultEndpointsProtocol=https;` +
    `AccountName=${accountName};` +
    `AccountKey=${accountKey};` +
    `EndpointSuffix=core.windows.net`;

  this.blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
}

  private async getContainer(): Promise<ContainerClient> {
    if (!this.blobServiceClient) {
      await this.initialize();
    }
    if (!this.blobServiceClient) {
      throw new Error('BlobServiceClient is not initialized');
    }

    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    if (!containerName) {
      throw new Error('AZURE_STORAGE_CONTAINER_NAME is not configured');
    }

    return this.blobServiceClient.getContainerClient(containerName);
  }

  async uploadFile(file: any): Promise<string> {
    const container = await this.getContainer();

    // UUID name: no spaces/special characters, never collides
    const blobName = `${randomUUID()}${extname(file.originalname || '').toLowerCase()}`;
    const blockBlobClient = container.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    return blockBlobClient.url;
  }


  
async downloadFile(url: string): Promise<Buffer> {
  const container = await this.getContainer();

  const parsedUrl = new URL(url);
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

  // Accept only images from your configured Azure Storage account.
  const expectedHost = `${accountName}.blob.core.windows.net`;

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname.toLowerCase() !== expectedHost.toLowerCase()
  ) {
    throw new Error('Image URL is not from the configured Azure Storage account');
  }

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

  if (!containerName) {
    throw new Error('AZURE_STORAGE_CONTAINER_NAME is not configured');
  }

  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  if (
    pathParts.length !== 2 ||
    pathParts[0] !== containerName
  ) {
    throw new Error('Image URL does not belong to the configured container');
  }

  const blobName = decodeURIComponent(pathParts[1]);
  const blobClient = container.getBlobClient(blobName);

  const download = await blobClient.download();

  if (!download.readableStreamBody) {
    throw new Error('Could not download the product image');
  }

  const chunks: Buffer[] = [];

  for await (const chunk of download.readableStreamBody) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}


  // Delete a blob using the imageUrl saved in the database
  async deleteFile(url?: string | null): Promise<void> {
    if (!url) return;

    try {
      const container = await this.getContainer();
      const blobName = decodeURIComponent(
        new URL(url).pathname.split('/').pop() || '',
      );
      if (!blobName) return;

      await container.getBlockBlobClient(blobName).deleteIfExists();
    } catch (err) {
      // Cleanup must never fail the request
      console.error('Blob delete failed:', err);
    }
  }
}
