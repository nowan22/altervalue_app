import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Generate a presigned URL for single-part file upload (≤100MB recommended)
 * @param fileName - Name of the file
 * @param contentType - MIME type of the file
 * @param isPublic - Whether the file should be publicly accessible
 * @returns Object with uploadUrl and cloud_storage_path
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  // Generate cloud_storage_path
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${Date.now()}-${fileName}`
    : `${folderPrefix}uploads/${Date.now()}-${fileName}`;

  // Create PutObjectCommand with ContentDisposition if public
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  // Generate presigned URL with 60 minute expiry
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { uploadUrl, cloud_storage_path };
}

/**
 * Initiate a multipart upload for large files (>100MB)
 * @param fileName - Name of the file
 * @param isPublic - Whether the file should be publicly accessible
 * @returns Object with uploadId and cloud_storage_path
 */
export async function initiateMultipartUpload(
  fileName: string,
  isPublic = false
): Promise<{ uploadId: string; cloud_storage_path: string }> {
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${Date.now()}-${fileName}`
    : `${folderPrefix}uploads/${Date.now()}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  const response = await s3Client.send(command);
  
  if (!response.UploadId) {
    throw new Error('Failed to initiate multipart upload');
  }

  return {
    uploadId: response.UploadId,
    cloud_storage_path,
  };
}

/**
 * Get a presigned URL for uploading a single part in a multipart upload
 * @param cloud_storage_path - S3 key of the file
 * @param uploadId - Upload ID from initiateMultipartUpload
 * @param partNumber - Part number (1-indexed)
 * @returns Presigned URL for uploading the part
 */
export async function getPresignedUrlForPart(
  cloud_storage_path: string,
  uploadId: string,
  partNumber: number
): Promise<string> {
  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Complete a multipart upload
 * @param cloud_storage_path - S3 key of the file
 * @param uploadId - Upload ID from initiateMultipartUpload
 * @param parts - Array of {ETag, PartNumber} pairs
 */
export async function completeMultipartUpload(
  cloud_storage_path: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>
): Promise<void> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  await s3Client.send(command);
}

/**
 * Get a URL for accessing a file
 * @param cloud_storage_path - S3 key of the file
 * @param isPublic - Whether the file is public
 * @returns Public URL or signed URL with expiry
 */
export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean
): Promise<string> {
  if (isPublic) {
    // Return public URL
    const region = process.env.AWS_REGION || 'us-west-2';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  } else {
    // Generate signed URL with 1 hour expiry
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cloud_storage_path,
      ResponseContentDisposition: 'attachment',
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }
}

/**
 * Delete a file from S3
 * @param cloud_storage_path - S3 key of the file
 */
export async function deleteFile(cloud_storage_path: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });
  await s3Client.send(command);
}
