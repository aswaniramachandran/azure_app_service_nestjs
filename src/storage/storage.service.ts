import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { type Multer } from 'multer';

@Injectable()
export class StorageService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    const connectionString =
      `DefaultEndpointsProtocol=https;` +
      `AccountName=${accountName};` +
      `AccountKey=${accountKey};` +
      `EndpointSuffix=core.windows.net`;

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  async uploadFile(file: any): Promise<string> {
    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME;

    const containerClient =
      this.blobServiceClient.getContainerClient(containerName!);

    const blobName = `${Date.now()}-${file.originalname}`;

    const blockBlobClient =
      containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
      },
    });

    return blockBlobClient.url;
  }
}