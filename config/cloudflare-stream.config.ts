export interface CloudflareStreamConfig {
  accountId: string;
  apiToken: string;
  cdnDomain: string;
  r2BucketName: string;
  enableEdgeCaching: boolean;
  cacheTTL: number;
  maxFileSize: number;
  allowedFormats: string[];
  compressionSettings: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    targetBitrate: number;
  };
}

export const cloudflareStreamConfig: CloudflareStreamConfig = {
  accountId: process.env.R2_ACCOUNT_ID || '',
  apiToken: process.env.R2_ACCESS_KEY_ID || '',
  cdnDomain: process.env.CDN_DOMAIN || 'https://cdn.v-edfinance.com',
  r2BucketName: process.env.R2_BUCKET_NAME || 'v-edfinance-videos',
  enableEdgeCaching: true,
  cacheTTL: 31536000,
  maxFileSize: 500 * 1024 * 1024,
  allowedFormats: ['mp4', 'webm', 'mov', 'avi'],
  compressionSettings: {
    enabled: true,
    quality: 'high',
    targetBitrate: 2500000,
  },
};

export function validateCloudflareConfig(): void {
  const required = ['accountId', 'apiToken', 'r2BucketName'];
  const missing = required.filter(
    (key) => !cloudflareStreamConfig[key as keyof CloudflareStreamConfig],
  );

  if (missing.length > 0) {
    console.warn(`[CloudflareStreamConfig] Missing required fields: ${missing.join(', ')}`);
  }
}
