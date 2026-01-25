# RETROUVONSLES - Cloudinary Implementation Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Upload Services](#upload-services)
5. [Transformation Services](#transformation-services)
6. [Main Service](#main-service)
7. [API Reference](#api-reference)
8. [Usage Examples](#usage-examples)
9. [Integration Patterns](#integration-patterns)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Cloudinary integration for RETROUVONSLES provides a comprehensive image and file management solution for the missing persons platform. It handles:

- **Image uploads** from various sources (file, blob, URL, canvas)
- **Image transformations** for optimization and privacy
- **Responsive image variants** for mobile and web
- **Progress tracking** for uploads
- **Retry logic** with exponential backoff
- **Session management** for monitoring uploads
- **Face detection and blurring** for privacy protection
- **Batch uploads** with progress tracking

### Key Features

- ✅ **8 Upload Configuration Types** (profiles, persons, documents, dossiers, reports, IA analysis, videos, general)
- ✅ **9 Transformation Presets** (thumbnail, medium, large, avatar, hero, square, portrait, landscape, effects)
- ✅ **30+ Transformation Functions** (resize, effects, filters, privacy, overlays)
- ✅ **Complete Type Safety** with full TypeScript interfaces
- ✅ **Production Grade** error handling and validation
- ✅ **Session Tracking** for monitoring upload progress
- ✅ **Singleton Pattern** for application-wide access

---

## Architecture

### File Structure

```
src/services/cloudinary/
├── cloudinaryConfig.ts      (400+ lines) - Configuration & presets
├── cloudinaryUpload.ts      (300+ lines) - Upload handling
├── cloudinaryTransform.ts   (570+ lines) - Image transformations
├── cloudinaryService.ts     (480+ lines) - Main service wrapper
└── index.ts                 (50+ lines)  - Barrel exports
```

### Component Responsibilities

#### 1. **cloudinaryConfig.ts** - Configuration System
- Upload configurations (8 types)
- Transformation presets (9 presets)
- Validation functions
- Utility helpers
- Configuration initialization from environment variables

#### 2. **cloudinaryUpload.ts** - Upload Engine
- Single file uploads with progress
- Batch uploads
- Blob uploads (canvas exports)
- URL uploads (external sources)
- Eager transformations
- Retry logic with exponential backoff

#### 3. **cloudinaryTransform.ts** - Transformation Engine
- Basic image resizing and cropping
- Preset application
- Responsive image generation
- Format conversion
- Effect application (filters)
- Privacy protection (blur, pixelate)
- Overlay and watermarking

#### 4. **cloudinaryService.ts** - Service Layer
- Unified API interface
- Singleton pattern for global access
- Session tracking and management
- Integration of upload and transformation services
- Public methods for all operations

---

## Configuration

### Environment Variables

Required environment variables in `.env`:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
REACT_APP_CLOUDINARY_API_KEY=your_api_key
```

### Upload Configuration Types

#### 1. **Profile Photo** (5MB)
```typescript
- Folder: retrouvonsles/profiles
- Max Size: 5MB
- Formats: jpg, jpeg, png, webp
- Auto-crop to face: 400x400px
- Use case: User profile pictures
```

#### 2. **Person Photo** (10MB)
```typescript
- Folder: retrouvonsles/personnes
- Max Size: 10MB
- Formats: jpg, jpeg, png, webp, gif
- Sizing: 600x800px (fit)
- Use case: Missing person dossier photos
```

#### 3. **Document** (20MB)
```typescript
- Folder: retrouvonsles/documents
- Max Size: 20MB
- Formats: pdf, doc, docx, xls, xlsx, jpg, jpeg, png
- Use case: Official reports, certificates, evidence
```

#### 4. **Dossier Attachment** (15MB)
```typescript
- Folder: retrouvonsles/dossiers
- Max Size: 15MB
- Formats: jpg, jpeg, png, webp, pdf, doc, docx
- Use case: Case file attachments
```

#### 5. **Report/Signalement Attachment** (10MB)
```typescript
- Folder: retrouvonsles/signalements
- Max Size: 10MB
- Formats: jpg, jpeg, png, webp, pdf
- Use case: Citizen report attachments and photos
```

#### 6. **IA Analysis** (25MB)
```typescript
- Folder: retrouvonsles/ia-analysis
- Max Size: 25MB
- Formats: jpg, jpeg, png, webp, gif
- Use case: Facial recognition and pattern analysis
```

#### 7. **Video** (100MB)
```typescript
- Folder: retrouvonsles/videos
- Max Size: 100MB
- Formats: mp4, webm, mov, avi
- Use case: Video evidence and testimonies
```

#### 8. **General** (10MB default)
```typescript
- Folder: retrouvonsles/uploads
- Max Size: 10MB
- Formats: jpg, jpeg, png, webp, gif, pdf, doc, docx
- Use case: Any other uploads
```

### Transformation Presets

#### 1. **Thumbnail** (150x150px)
- Perfect for list views and galleries
- Optimized for web loading

#### 2. **Medium** (400x300px)
- Card display sizes
- Balanced quality/size

#### 3. **Large** (800x600px)
- Detail view display
- High quality for desktop

#### 4. **Avatar** (200x200px)
- User profile pictures
- Face-centered auto-crop

#### 5. **Hero** (1920x1080px)
- Full-width banners
- Maximum quality

#### 6. **Square** (500x500px)
- Gallery and grid displays
- Center-cropped

#### 7. **Portrait** (400x600px)
- Person cards
- Portrait orientation

#### 8. **Landscape** (800x450px)
- Wide displays
- Landscape orientation

#### 9. **Effects**
- Grayscale
- Sepia
- Blur
- Pixelate
- Oil paint
- Cartoonify

---

## Upload Services

### Function: `uploadFileToCloudinary()`

Upload a single file with progress tracking.

```typescript
const result = await uploadFileToCloudinary(
  file: File,
  options: UploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult>
```

**Parameters:**
- `file`: File object to upload
- `options`: Upload configuration
- `onProgress`: Callback for progress updates

**Returns:**
- `UploadResult` with success, URL, public_id, error

**Example:**
```typescript
const handleUpload = async (file: File) => {
  try {
    const result = await cloudinaryService.uploadFile(
      file,
      'personnePhoto',
      {},
      (progress) => {
        console.log(`Upload: ${progress.percentage}%`);
      }
    );
    
    if (result.success) {
      console.log('Image URL:', result.url);
      // Save URL to database
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Function: `uploadMultipleFiles()`

Upload multiple files sequentially with per-file progress.

```typescript
const results = await uploadMultipleFiles(
  files: File[],
  options: UploadOptions,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]>
```

**Example:**
```typescript
const handleMultipleUpload = async (files: File[]) => {
  const results = await cloudinaryService.uploadMultiple(
    files,
    'personnePhoto',
    {},
    (index, progress) => {
      console.log(`File ${index + 1}: ${progress.percentage}%`);
    }
  );
  
  const urls = results
    .filter(r => r.success)
    .map(r => r.url);
};
```

### Function: `uploadBlob()`

Upload from blob data (canvas, generated images).

```typescript
const result = await uploadBlob(
  blob: Blob,
  fileName: string,
  options: UploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult>
```

**Example:**
```typescript
// From canvas
const canvas = canvasRef.current;
canvas.toBlob(async (blob) => {
  const result = await cloudinaryService.uploadBlob(
    blob!,
    'photo-signature.png',
    'personnePhoto'
  );
});
```

### Function: `uploadFromUrl()`

Upload from external URL (no progress tracking).

```typescript
const result = await uploadFromUrl(
  url: string,
  options: UploadOptions
): Promise<UploadResult>
```

**Example:**
```typescript
const result = await cloudinaryService.uploadFromUrl(
  'https://example.com/image.jpg',
  'personnePhoto'
);
```

### Function: `uploadWithRetry()`

Upload with automatic retry on failure (exponential backoff).

```typescript
const result = await uploadWithRetry(
  file: File,
  options: UploadOptions,
  maxRetries: number = 3,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult>
```

**Retry Strategy:**
- Initial delay: 1 second
- Exponential backoff: 1s → 2s → 4s → 8s
- Maximum retries: 3 (default)

**Example:**
```typescript
const result = await cloudinaryService.uploadWithRetry(
  file,
  'personnePhoto',
  5
);
```

---

## Transformation Services

### Basic Transformations

#### `resize(publicId, width, height)`
Resize maintaining aspect ratio.

```typescript
const transformed = cloudinaryService.resize(publicId, 400, 300);
// Returns: TransformedUrl with width/height/fit
```

#### `thumbnail(publicId, size)`
Create square thumbnail.

```typescript
const thumb = cloudinaryService.thumbnail(publicId, 150);
// Returns: 150x150px thumbnail
```

#### `avatar(publicId, size)`
Create circular avatar with face detection.

```typescript
const avatar = cloudinaryService.avatar(publicId, 200);
// Returns: 200x200px circular avatar, face-centered
```

### Responsive Images

#### `createSrcSet(publicId, maxWidth, sizes)`
Generate responsive image srcset.

```typescript
const srcSet = cloudinaryService.createSrcSet(
  publicId,
  800,
  ['480', '768', '1024', '1280']
);
// Returns: srcSet string for responsive images
```

**HTML Usage:**
```html
<img 
  src={cloudinaryService.thumbnail(publicId, 300).url}
  srcSet={srcSet}
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 80vw, 60vw"
  alt="Person"
/>
```

#### `getResponsiveUrls(publicId)`
Get pre-configured responsive variants.

```typescript
const urls = cloudinaryService.getResponsiveUrls(publicId);
// Returns: {
//   small: 300px url,
//   medium: 600px url,
//   large: 1200px url,
//   srcSet: responsive srcset
// }
```

### Format & Quality

#### `convertFormat(publicId, format)`
Convert image format.

```typescript
// Convert to WebP
const webp = cloudinaryService.convertFormat(publicId, 'webp');

// Auto format (serves WebP to supporting browsers)
const auto = cloudinaryService.convertFormat(publicId, 'auto');
```

#### `optimizeForWeb(publicId, width, height)`
Optimize for web delivery.

```typescript
const optimized = cloudinaryService.optimizeForWeb(publicId, 800, 600);
// Returns: Compressed with auto-format and quality optimization
```

### Privacy & Security

#### `blurForPrivacy(publicId, intensity)`
Blur image for privacy protection.

```typescript
const blurred = cloudinaryService.blurForPrivacy(publicId, 30);
// Intensity: 1-100 (1 = light, 100 = heavy)
```

**Use Cases:**
- Partial face blur for witness protection
- Background blur for location privacy
- Sensitive content obscuring

#### `pixelateForPrivacy(publicId)`
Pixelate image (mosaic effect).

```typescript
const pixelated = cloudinaryService.pixelateForPrivacy(publicId);
// Perfect for unidentified persons
```

#### `autoBlurFaces(publicId)`
Automatically detect and blur faces.

```typescript
const blurred = cloudinaryService.autoBlurFaces(publicId);
// Uses Cloudinary's face detection (requires config)
```

#### `cropToFace(publicId)`
Auto-crop to detected face.

```typescript
const cropped = cloudinaryService.cropToFace(publicId);
// Perfect for profile pictures and dossier thumbnails
```

### Visual Effects

#### `applyEffect(publicId, effect)`
Apply visual effects/filters.

```typescript
// Available effects:
const effects = [
  'grayscale',      // Black & white
  'sepia',          // Vintage brown tones
  'blur',           // Gaussian blur
  'pixelate',       // Mosaic effect
  'oil_paint',      // Oil painting effect
  'cartoonify'      // Cartoon effect
];

const grayscale = cloudinaryService.applyEffect(publicId, 'grayscale');
const sepia = cloudinaryService.applyEffect(publicId, 'sepia');
```

#### `adjustColors(publicId, brightness, contrast, saturation)`
Adjust color properties.

```typescript
const adjusted = cloudinaryService.adjustColors(publicId, {
  brightness: 10,    // -100 to +100
  contrast: 20,      // -100 to +100
  saturation: 30     // -100 to +100
});

// Enhance dark photos
const brightened = cloudinaryService.adjustColors(publicId, {
  brightness: 15,
  contrast: 10
});
```

#### `addBorder(publicId, width, color)`
Add colored border.

```typescript
const bordered = cloudinaryService.addBorder(publicId, 5, 'FF0000');
// 5px red border
```

#### `addShadow(publicId)`
Add drop shadow effect.

```typescript
const shadowed = cloudinaryService.addShadow(publicId);
```

#### `addWatermark(publicId, watermarkPublicId)`
Add watermark overlay.

```typescript
const watermarked = cloudinaryService.addWatermark(
  photoId,
  'retrouvonsles/watermarks/logo'
);
```

#### `addTextOverlay(publicId, text, color, fontSize)`
Add text overlay.

```typescript
const overlayed = cloudinaryService.addTextOverlay(
  photoId,
  'MISSING PERSON',
  'FF0000',  // Red
  32         // Font size
);
```

### Advanced

#### `createImageVariants(publicId, baseWidth, baseHeight)`
Create all common variants at once.

```typescript
const variants = cloudinaryService.createImageVariants(publicId, 800, 600);
// Returns: {
//   original: Full URL,
//   thumbnail: 150x150,
//   small: 300x225,
//   medium: 800x600,
//   large: 1200x900,
//   srcSet: Responsive srcset
// }
```

---

## Main Service

### Singleton Instance: `cloudinaryService`

The main service is exported as a singleton and auto-initialized.

```typescript
import { cloudinaryService } from '@/services/cloudinary';

// No initialization needed - auto-initialized on module load
const result = await cloudinaryService.uploadFile(file, 'personnePhoto');
```

### Methods Overview

**Upload Methods:**
- `uploadFile(file, uploadType, options?, onProgress?)`
- `uploadMultiple(files, uploadType, options?, onProgress?)`
- `uploadWithRetry(file, uploadType, options?, maxRetries?, onProgress?)`
- `uploadFromUrl(url, uploadType, options?)`

**Validation Methods:**
- `validateFile(file, uploadType)`
- `getUploadLimits(uploadType)`

**Transformation Methods:**
- `transformImage(publicId, transformations)`
- `applyPreset(publicId, preset)`
- `resize(publicId, width, height)`
- `thumbnail(publicId, size)`
- `avatar(publicId, size)`
- `createSrcSet(publicId, maxWidth, sizes?)`
- `getResponsiveUrls(publicId)`
- `optimizeForWeb(publicId, width?, height?)`
- `convertFormat(publicId, format)`
- `applyEffect(publicId, effect)`
- `blurForPrivacy(publicId, intensity?)`
- `pixelateForPrivacy(publicId)`
- `cropToFace(publicId)`
- `addBorder(publicId, width, color)`
- `addWatermark(publicId, watermarkPublicId)`
- `createImageVariants(publicId, baseWidth?, baseHeight?)`

**Session Management:**
- `getSessionStatus(sessionId)`
- `getAllSessions()`
- `clearSession(sessionId)`
- `clearAllSessions()`

**Utilities:**
- `formatFileSize(bytes)`
- `getFileIcon(fileName)`
- `isConfigured()`
- `getConfig()`

---

## API Reference

### Type Definitions

#### `UploadResult`
```typescript
interface UploadResult {
  success: boolean;
  data?: {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
  };
  error?: string;
  publicId?: string;
  url?: string;
  secureUrl?: string;
}
```

#### `UploadOptions`
```typescript
interface UploadOptions {
  type?: keyof typeof UPLOAD_CONFIGS;
  tags?: string[];
  context?: Record<string, string>;
  publicId?: string;
  overwrite?: boolean;
  resourceType?: 'auto' | 'image' | 'video' | 'raw';
}
```

#### `UploadProgress`
```typescript
interface UploadProgress {
  percentage: number;    // 0-100
  loaded: number;        // Bytes uploaded
  total: number;         // Total bytes
}
```

#### `CloudinaryTransformation`
```typescript
interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  quality?: string | number;
  fetch_format?: string;
  angle?: number;
  opacity?: number;
  blur?: number;
  effect?: string;
  radius?: number | string;
  background?: string;
  overlay?: string;
  underlay?: string;
  border?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  [key: string]: any;
}
```

#### `FileUploadSession`
```typescript
interface FileUploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadType: keyof typeof UPLOAD_CONFIGS;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  uploadedAt?: Date;
  publicId?: string;
  url?: string;
  error?: string;
}
```

---

## Usage Examples

### Example 1: Upload Person Photo for Dossier

```typescript
// In PersonnePhotos.tsx
import { cloudinaryService } from '@/services/cloudinary';

const handlePhotoUpload = async (file: File) => {
  try {
    // Validate file
    const isValid = cloudinaryService.validateFile(file, 'personnePhoto');
    if (!isValid) {
      throw new Error('Invalid file for person photos');
    }

    // Upload with progress
    const result = await cloudinaryService.uploadFile(
      file,
      'personnePhoto',
      { tags: ['personne', dossierId] },
      (progress) => {
        setUploadProgress(progress.percentage);
      }
    );

    if (result.success) {
      // Save to database
      await addPersonnePhoto(personneId, result.url, 'portrait');
      toast.success('Photo uploaded successfully');
    }
  } catch (error) {
    toast.error('Upload failed: ' + error.message);
  }
};
```

### Example 2: Display Responsive Person Image

```typescript
// In PersonCard.tsx
import { cloudinaryService } from '@/services/cloudinary';

const PersonCard = ({ person }) => {
  const imageUrl = cloudinaryService.thumbnail(person.photo_url, 300);
  const responsiveUrls = cloudinaryService.getResponsiveUrls(person.photo_url);

  return (
    <div className="person-card">
      <img
        src={imageUrl.url}
        srcSet={responsiveUrls.srcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={person.full_name}
        className="person-image"
      />
      <div className="person-info">
        <h3>{person.full_name}</h3>
        <p>{person.age} years old</p>
      </div>
    </div>
  );
};
```

### Example 3: Privacy-Protected Image Display

```typescript
// For witnesses or sensitive content
const PrivateImageDisplay = ({ publicId, blurIntensity = 30 }) => {
  const blurredUrl = cloudinaryService.blurForPrivacy(publicId, blurIntensity);

  return (
    <div className="private-image">
      <img src={blurredUrl.url} alt="Protected content" />
      <p>This image is blurred to protect privacy</p>
    </div>
  );
};
```

### Example 4: Batch Upload Reports

```typescript
// In SignalementForm.tsx
const handleMultiplePhotosUpload = async (files: File[]) => {
  try {
    const results = await cloudinaryService.uploadMultiple(
      files,
      'signalementAttachment',
      { tags: ['signalement', signalementId] },
      (fileIndex, progress) => {
        console.log(
          `Uploading photo ${fileIndex + 1}/${files.length}: ${progress.percentage}%`
        );
      }
    );

    const successfulUploads = results.filter(r => r.success);
    if (successfulUploads.length > 0) {
      // Save all URLs to database
      await saveSignalementPhotos(
        signalementId,
        successfulUploads.map(r => r.url)
      );
    }
  } catch (error) {
    console.error('Batch upload failed:', error);
  }
};
```

### Example 5: IA Analysis Preparation

```typescript
// For facial recognition
const prepareForAIAnalysis = async (publicId: string) => {
  const optimized = cloudinaryService.optimizeForWeb(publicId, 800, 600);
  const faceUrl = cloudinaryService.cropToFace(publicId);

  return {
    original: optimized.url,
    faceCropped: faceUrl.url,
    quality: 'auto'
  };
};
```

### Example 6: Create Image Gallery

```typescript
// In DossierPhotos.tsx
const DossierPhotoGallery = ({ photos }) => {
  const variants = photos.map(photo => ({
    id: photo.id,
    thumb: cloudinaryService.thumbnail(photo.publicId, 200),
    medium: cloudinaryService.applyPreset(photo.publicId, 'medium'),
    large: cloudinaryService.applyPreset(photo.publicId, 'large'),
  }));

  return (
    <div className="photo-gallery">
      {variants.map(variant => (
        <div key={variant.id} className="gallery-item">
          <img src={variant.thumb.url} alt="Thumbnail" />
        </div>
      ))}
    </div>
  );
};
```

---

## Integration Patterns

### Pattern 1: Upload Component Hook

```typescript
// hooks/useCloudinaryUpload.ts
import { useState } from 'react';
import { cloudinaryService } from '@/services/cloudinary';

export const useCloudinaryUpload = (uploadType) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const result = await cloudinaryService.uploadFile(
        file,
        uploadType,
        {},
        (progress) => setProgress(progress.percentage)
      );

      if (!result.success) throw new Error(result.error);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, progress, error };
};
```

### Pattern 2: Image Display Component

```typescript
// components/OptimizedImage.tsx
interface OptimizedImageProps {
  publicId: string;
  alt: string;
  maxWidth?: number;
  preset?: 'thumbnail' | 'medium' | 'large' | 'avatar';
  blur?: boolean;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  publicId,
  alt,
  maxWidth = 800,
  preset = 'medium',
  blur = false,
  priority = false,
}) => {
  let imageUrl = cloudinaryService.applyPreset(publicId, preset);

  if (blur) {
    imageUrl = cloudinaryService.blurForPrivacy(publicId, 20);
  }

  const responsive = cloudinaryService.getResponsiveUrls(publicId);

  return (
    <img
      src={imageUrl.url}
      srcSet={responsive.srcSet}
      sizes={`(max-width: 640px) 100vw, ${maxWidth}px`}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className="optimized-image"
    />
  );
};
```

### Pattern 3: Form Integration

```typescript
// In any form component
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

const MyForm = () => {
  const { upload, uploading, progress } = useCloudinaryUpload('personnePhoto');
  const [imageUrl, setImageUrl] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await upload(file);
      setImageUrl(result.url!);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
        accept="image/*"
      />
      {uploading && <progress value={progress} max={100} />}
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
};
```

---

## Error Handling

### Common Errors & Solutions

#### Error: "Cloudinary is not properly configured"
**Cause:** Environment variables not set
**Solution:**
```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
REACT_APP_CLOUDINARY_API_KEY=your_api_key
```

#### Error: "File size exceeds limit"
**Cause:** File larger than upload type's max size
**Solution:**
```typescript
const isValid = cloudinaryService.validateFile(file, 'personnePhoto');
// maxSize for personnePhoto is 10MB
```

#### Error: "Invalid file format"
**Cause:** File type not allowed for upload type
**Solution:** Check allowed_formats for each upload type and validate client-side

#### Error: "Network timeout"
**Solution:** Use uploadWithRetry() which implements exponential backoff

```typescript
const result = await cloudinaryService.uploadWithRetry(
  file,
  'personnePhoto',
  3  // 3 retries
);
```

### Error Handling Best Practices

```typescript
try {
  const result = await cloudinaryService.uploadFile(file, 'personnePhoto');

  if (!result.success) {
    // Handle upload error
    console.error('Upload error:', result.error);
    showErrorToast(result.error);
    return;
  }

  // Handle success
  console.log('Uploaded to:', result.url);
  saveUrlToDatabase(result.url);
} catch (error) {
  // Handle network/system errors
  console.error('System error:', error);
  showErrorToast('System error occurred');
}
```

---

## Best Practices

### 1. **Image Optimization**

```typescript
// ✅ Good: Use optimizeForWeb for images
const optimized = cloudinaryService.optimizeForWeb(publicId, 800, 600);

// ✅ Good: Use auto format for browser compatibility
const responsive = cloudinaryService.convertFormat(publicId, 'auto');

// ❌ Avoid: Uploading large images without transformation
const result = await cloudinaryService.uploadFile(file, 'general');
```

### 2. **Privacy Protection**

```typescript
// ✅ Good: Blur faces for privacy
const blurred = cloudinaryService.blurForPrivacy(publicId, 30);

// ✅ Good: Pixelate sensitive content
const pixelated = cloudinaryService.pixelateForPrivacy(publicId);

// ❌ Avoid: Exposing full faces of minors or witnesses
```

### 3. **Responsive Images**

```typescript
// ✅ Good: Use srcSet for responsive design
const responsive = cloudinaryService.getResponsiveUrls(publicId);
<img srcSet={responsive.srcSet} sizes="..." alt="" />

// ❌ Avoid: Single size for all devices
<img src={largeUrl} alt="" />
```

### 4. **Error Handling**

```typescript
// ✅ Good: Use retry for unreliable networks
const result = await cloudinaryService.uploadWithRetry(file, 'personnePhoto', 3);

// ✅ Good: Validate before uploading
if (!cloudinaryService.validateFile(file, 'personnePhoto')) {
  throw new Error('Invalid file');
}

// ❌ Avoid: Uploading without validation
await cloudinaryService.uploadFile(file, 'personnePhoto');
```

### 5. **Session Management**

```typescript
// ✅ Good: Clear old sessions periodically
const allSessions = cloudinaryService.getAllSessions();
allSessions.forEach(session => {
  if (session.status === 'failed' || session.status === 'success') {
    cloudinaryService.clearSession(session.id);
  }
});

// ❌ Avoid: Memory leaks from unreleased sessions
```

### 6. **Performance**

```typescript
// ✅ Good: Use thumbnails for lists
const thumb = cloudinaryService.thumbnail(publicId, 150);

// ✅ Good: Lazy load images
<img loading="lazy" src={thumb.url} alt="" />

// ❌ Avoid: Loading large images in lists
const large = cloudinaryService.applyPreset(publicId, 'large');
// Using large in list view = slow
```

### 7. **Accessibility**

```typescript
// ✅ Good: Provide meaningful alt text
<img src={imageUrl} alt="Missing person John Doe, 25 years old" />

// ✅ Good: Describe image types
<img src={blurred.url} alt="Portrait (blurred for privacy)" />

// ❌ Avoid: Missing alt text
<img src={imageUrl} />
```

---

## Troubleshooting

### Upload Hangs

**Symptoms:** Upload never completes
**Solutions:**
1. Check network connectivity
2. Verify file size is under limit
3. Use uploadWithRetry() instead of uploadFile()
4. Check browser console for errors

### Transformations Not Applied

**Symptoms:** URL is transformed but image looks unchanged
**Solutions:**
1. Clear browser cache
2. Verify transformation parameters
3. Check if effect/filter is supported
4. Test with different public_id

### Memory Issues

**Symptoms:** Browser becomes slow after multiple uploads
**Solutions:**
```typescript
// Clear old sessions regularly
cloudinaryService.clearAllSessions();

// Clean up event listeners in components
useEffect(() => {
  return () => {
    // Cleanup code
  };
}, []);
```

### Authentication Errors

**Symptoms:** "Unauthorized" or "Invalid signature" errors
**Solutions:**
1. Regenerate upload preset in Cloudinary dashboard
2. Verify environment variables are set correctly
3. Check that API key is for correct cloud name
4. Reset upload preset if compromised

### CORS Issues

**Symptoms:** "Access-Control-Allow-Origin" header errors
**Solutions:**
1. Cloudinary URLs are CORS-enabled by default
2. Verify CORS settings in Cloudinary dashboard
3. For signed uploads, ensure backend is configured
4. Test in private browser window

---

## Summary

The Cloudinary integration provides:

✅ **Complete image management** for missing persons platform
✅ **Production-grade reliability** with error handling and retries
✅ **Privacy protection** with blur and pixelate functions
✅ **Performance optimization** with responsive variants
✅ **Type safety** with full TypeScript support
✅ **Easy integration** with singleton pattern
✅ **Session tracking** for monitoring uploads
✅ **Best practices** documentation and examples

For questions or issues, refer to:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [RETROUVONSLES API Documentation](../API_IMPLEMENTATION_COMPLETE.md)
- [TypeScript Types Reference](#api-reference)

---

**Last Updated:** January 19, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
