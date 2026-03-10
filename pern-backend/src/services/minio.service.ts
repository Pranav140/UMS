import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    region: 'us-east-1', // Default region
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'miniouser',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'miniopassword123'
    },
    forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET || 'ums-storage';

export async function generateUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function generateDownloadUrl(key: string) {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
}
