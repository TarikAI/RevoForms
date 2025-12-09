import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Supported storage providers
type StorageProvider = 'local' | 's3' | 'gcs' | 'cloudinary' | 'uploadcare'

// File upload configuration
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  uploadDir: path.join(process.cwd(), 'uploads'),
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const provider = (formData.get('provider') as StorageProvider) || 'local'
    const folder = (formData.get('folder') as string) || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const results = []

    for (const file of files) {
      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          results.push({
            name: file.name,
            error: validation.error,
          })
          continue
        }

        // Upload based on provider
        let uploadResult
        switch (provider) {
          case 's3':
            uploadResult = await uploadToS3(file, folder)
            break
          case 'gcs':
            uploadResult = await uploadToGCS(file, folder)
            break
          case 'cloudinary':
            uploadResult = await uploadToCloudinary(file, folder)
            break
          case 'uploadcare':
            uploadResult = await uploadToUploadcare(file)
            break
          case 'local':
          default:
            uploadResult = await uploadToLocal(file, folder)
            break
        }

        results.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: uploadResult.url,
          provider,
          id: uploadResult.id,
        })

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error)
        results.push({
          name: file.name,
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Validate file
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB limit`,
    }
  }

  // Check file type (if not all types allowed)
  if (UPLOAD_CONFIG.allowedTypes.length > 0 && !UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    }
  }

  return { valid: true }
}

// Upload to local filesystem
async function uploadToLocal(file: File, folder: string): Promise<{ url: string; id: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Generate unique filename
  const fileExtension = path.extname(file.name)
  const fileName = `${uuidv4()}${fileExtension}`
  const relativePath = `${folder}/${fileName}`
  const fullPath = path.join(UPLOAD_CONFIG.uploadDir, relativePath)

  // Ensure directory exists
  await mkdir(path.dirname(fullPath), { recursive: true })

  // Write file
  await writeFile(fullPath, buffer)

  // Return URL
  const url = `/uploads/${relativePath}`
  const id = uuidv4()

  return { url, id }
}

// Upload to AWS S3
async function uploadToS3(file: File, folder: string): Promise<{ url: string; id: string }> {
  const AWS = require('aws-sdk')
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  })

  const fileExtension = path.extname(file.name)
  const fileName = `${uuidv4()}${fileExtension}`
  const key = `${folder}/${fileName}`

  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read',
  }

  const result = await s3.upload(params).promise()

  return {
    url: result.Location,
    id: result.Key,
  }
}

// Upload to Google Cloud Storage
async function uploadToGCS(file: File, folder: string): Promise<{ url: string; id: string }> {
  const { Storage } = require('@google-cloud/storage')
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE,
  })

  const bucket = storage.bucket(process.env.GCS_BUCKET!)
  const fileExtension = path.extname(file.name)
  const fileName = `${uuidv4()}${fileExtension}`
  const key = `${folder}/${fileName}`

  const fileUpload = bucket.file(key)
  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.type,
    },
  })

  const [url] = await fileUpload.getSignedUrl({
    action: 'read',
    expires: '03-01-2500', // Far future date
  })

  return {
    url,
    id: key,
  }
}

// Upload to Cloudinary
async function uploadToCloudinary(file: File, folder: string): Promise<{ url: string; id: string }> {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error: any, result: any) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(file.buffer)
  })

  const cloudinaryResult = result as any

  return {
    url: cloudinaryResult.secure_url,
    id: cloudinaryResult.public_id,
  }
}

// Upload to Uploadcare
async function uploadToUploadcare(file: File): Promise<{ url: string; id: string }> {
  const formData = new FormData()
  formData.append('UPLOADCARE_PUB_KEY', process.env.UPLOADCARE_PUBLIC_KEY!)
  formData.append('file', file)

  const response = await fetch('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (data.uuid) {
    return {
      url: `https://ucarecdn.com/${data.uuid}/`,
      id: data.uuid,
    }
  }

  throw new Error('Uploadcare upload failed')
}

// Get upload configuration
export async function GET() {
  return NextResponse.json({
    maxFileSize: UPLOAD_CONFIG.maxFileSize,
    maxFiles: 10,
    allowedTypes: UPLOAD_CONFIG.allowedTypes,
    providers: ['local', 's3', 'gcs', 'cloudinary', 'uploadcare'],
  })
}

// Delete file
export async function DELETE(request: NextRequest) {
  try {
    const { url, provider, id } = await request.json()

    if (!url || !provider || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    switch (provider) {
      case 'local':
        await deleteLocalFile(url)
        break
      case 's3':
        await deleteS3File(id)
        break
      case 'gcs':
        await deleteGCSFile(id)
        break
      case 'cloudinary':
        await deleteCloudinaryFile(id)
        break
      default:
        throw new Error('Unsupported provider')
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Delete failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Delete local file
async function deleteLocalFile(url: string) {
  const relativePath = url.replace('/uploads/', '')
  const fullPath = path.join(UPLOAD_CONFIG.uploadDir, relativePath)
  const fs = require('fs/promises')
  await fs.unlink(fullPath)
}

// Delete from S3
async function deleteS3File(key: string) {
  const AWS = require('aws-sdk')
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  })

  await s3.deleteObject({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  }).promise()
}

// Delete from GCS
async function deleteGCSFile(key: string) {
  const { Storage } = require('@google-cloud/storage')
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE,
  })

  const bucket = storage.bucket(process.env.GCS_BUCKET!)
  await bucket.file(key).delete()
}

// Delete from Cloudinary
async function deleteCloudinaryFile(publicId: string) {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  await cloudinary.uploader.destroy(publicId)
}