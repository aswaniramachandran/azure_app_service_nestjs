import { Injectable } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';

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
}