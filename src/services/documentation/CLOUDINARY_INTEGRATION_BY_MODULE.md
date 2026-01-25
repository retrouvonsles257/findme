# RETROUVONSLES - Cloudinary Integration Patterns by Module

Complete integration examples for each module using the Cloudinary service.

---

## 1. Personnes Module - Photo Management

### File: `src/features/personnes/hooks/usePersonnePhotosCloudinary.ts`

Integration of Cloudinary uploads for person photos in dossiers.

```typescript
/**
 * Hook for managing personne photos with Cloudinary
 */
import { useState, useCallback } from 'react';
import { cloudinaryService } from '@/services/cloudinary';

export interface UsePersonnePhotosCloudinaryProps {
  personneId: string;
  onPhotoAdded?: (url: string, publicId: string) => void;
  onPhotoDeleted?: (photoId: string) => void;
}

export const usePersonnePhotosCloudinary = ({
  personneId,
  onPhotoAdded,
  onPhotoDeleted,
}: UsePersonnePhotosCloudinaryProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Upload single photo
  const uploadPhoto = useCallback(
    async (file: File, photoType: 'portrait' | 'full_body' | 'document') => {
      try {
        // Validate file
        const validation = cloudinaryService.validateFile(file, 'personnePhoto');
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        setUploading(true);
        setError(null);

        // Upload with progress
        const result = await cloudinaryService.uploadFile(
          file,
          'personnePhoto',
          {
            tags: ['personne', personneId, photoType],
            context: {
              personneId,
              photoType,
              uploadedAt: new Date().toISOString(),
            },
          },
          (prog) => setProgress(prog.percentage)
        );

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Create thumbnail for preview
        const thumbnail = cloudinaryService.thumbnail(result.publicId!, 200);
        const optimized = cloudinaryService.optimizeForWeb(result.publicId!, 600, 800);

        // Call callback with result
        onPhotoAdded?.(result.url!, result.publicId!);

        return {
          publicId: result.publicId,
          url: result.url,
          thumbnail: thumbnail.url,
          optimized: optimized.url,
          type: photoType,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        throw err;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [personneId, onPhotoAdded]
  );

  // Upload multiple photos
  const uploadMultiplePhotos = useCallback(
    async (files: File[], photoType: 'portrait' | 'full_body' | 'document') => {
      try {
        setUploading(true);
        setError(null);

        const results = await cloudinaryService.uploadMultiple(
          files,
          'personnePhoto',
          {
            tags: ['personne', personneId, photoType],
          },
          (fileIndex, prog) => {
            const totalProgress = ((fileIndex + prog.percentage / 100) / files.length) * 100;
            setProgress(totalProgress);
          }
        );

        const successCount = results.filter((r) => r.success).length;
        if (successCount === 0) {
          throw new Error('All uploads failed');
        }

        return results
          .filter((r) => r.success)
          .map((r) => ({
            publicId: r.publicId!,
            url: r.url!,
            thumbnail: cloudinaryService.thumbnail(r.publicId!, 200).url,
          }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Batch upload failed';
        setError(message);
        throw err;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [personneId]
  );

  // Get image variants for display
  const getImageVariants = useCallback((publicId: string) => {
    return cloudinaryService.createImageVariants(publicId, 600, 800);
  }, []);

  // Get privacy-protected variant
  const getBlurredVariant = useCallback((publicId: string) => {
    return cloudinaryService.blurForPrivacy(publicId, 25);
  }, []);

  return {
    uploadPhoto,
    uploadMultiplePhotos,
    getImageVariants,
    getBlurredVariant,
    uploading,
    progress,
    error,
  };
};
```

### Usage in Component

```typescript
// In PersonnePhotosPanel.tsx
export const PersonnePhotosPanel: React.FC<{ personneId: string }> = ({ personneId }) => {
  const {
    uploadPhoto,
    uploadMultiplePhotos,
    getImageVariants,
    uploading,
    progress,
    error,
  } = usePersonnePhotosCloudinary({
    personneId,
    onPhotoAdded: (url, publicId) => {
      // Save to database
      savePersonnePhoto(personneId, {
        publicId,
        url,
        type: 'portrait',
      });
    },
  });

  const handlePhotoDrop = async (files: File[]) => {
    try {
      await uploadMultiplePhotos(files, 'portrait');
    } catch (error) {
      showErrorToast('Upload failed');
    }
  };

  return (
    <div className="photos-panel">
      <h3>Personne Photos</h3>

      {/* Upload Area */}
      <DropZone
        onDrop={handlePhotoDrop}
        disabled={uploading}
        accept="image/*"
      />

      {uploading && <ProgressBar value={progress} max={100} />}
      {error && <Alert type="error">{error}</Alert>}

      {/* Photo Gallery */}
      <PhotoGallery
        photos={personnePhotos}
        renderPhoto={(photo) => {
          const variants = getImageVariants(photo.publicId);
          return (
            <img
              src={variants.thumbnail}
              srcSet={variants.srcSet}
              alt={photo.type}
            />
          );
        }}
      />
    </div>
  );
};
```

---

## 2. Dossiers Module - Case File Attachments

### File: `src/features/dossiers/hooks/useDossierAttachments.ts`

Managing attachments for dossier disparition cases.

```typescript
/**
 * Hook for managing dossier attachments with Cloudinary
 */
import { useState, useCallback } from 'react';
import { cloudinaryService } from '@/services/cloudinary';

export const useDossierAttachments = (dossierId: string) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadAttachment = useCallback(
    async (file: File, description: string) => {
      try {
        // Determine upload type based on file
        let uploadType: 'personnePhoto' | 'document' | 'dossierAttachment' = 'dossierAttachment';
        
        if (file.type.startsWith('image/')) {
          uploadType = 'personnePhoto';
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          uploadType = 'document';
        }

        // Validate file
        const validation = cloudinaryService.validateFile(file, uploadType);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        setUploading(true);
        setError(null);

        // Upload file
        const result = await cloudinaryService.uploadFile(
          file,
          uploadType,
          {
            tags: ['dossier', dossierId, file.type.split('/')[0]],
            context: {
              dossierId,
              originalName: file.name,
              description,
            },
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Create file entry
        const uploadedFile = {
          id: result.publicId!,
          name: file.name,
          type: file.type,
          size: file.size,
          url: result.url!,
          uploadedAt: new Date(),
          description,
          thumbnail: file.type.startsWith('image/')
            ? cloudinaryService.thumbnail(result.publicId!, 150).url
            : undefined,
        };

        setUploadedFiles((prev) => [...prev, uploadedFile]);
        return uploadedFile;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [dossierId]
  );

  const getFilePreview = useCallback((publicId: string, fileType: string) => {
    if (!fileType.startsWith('image/')) {
      return {
        icon: cloudinaryService.getFileIcon('file'),
        type: 'document',
      };
    }

    return {
      thumbnail: cloudinaryService.thumbnail(publicId, 200).url,
      preview: cloudinaryService.applyPreset(publicId, 'medium').url,
      type: 'image',
    };
  }, []);

  return {
    uploadAttachment,
    getFilePreview,
    uploadedFiles,
    setUploadedFiles,
    uploading,
    error,
  };
};
```

---

## 3. Signalements Module - Citizen Reports

### File: `src/features/signalements/hooks/useSignalementPhotos.ts`

Managing photos in citizen-submitted sightings reports.

```typescript
/**
 * Hook for managing signalement photos with privacy controls
 */
import { useState, useCallback } from 'react';
import { cloudinaryService } from '@/services/cloudinary';

export const useSignalementPhotos = (signalementId: string) => {
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<SignalementPhoto[]>([]);

  const uploadSignalementPhoto = useCallback(
    async (file: File, location?: string) => {
      try {
        // Validate for signalement
        const validation = cloudinaryService.validateFile(file, 'signalementAttachment');
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        setUploadingPhotos(true);

        // Upload with metadata
        const result = await cloudinaryService.uploadFile(
          file,
          'signalementAttachment',
          {
            tags: ['signalement', signalementId, 'citizen_submission'],
            context: {
              signalementId,
              location: location || 'unknown',
              isAnonymous: true, // Flag for review
            },
          }
        );

        if (!result.success) throw new Error(result.error);

        // Create variants for display and analysis
        const variants = cloudinaryService.createImageVariants(result.publicId!, 600, 800);

        const photo = {
          id: result.publicId!,
          url: variants.medium,
          thumbnail: variants.thumbnail,
          location: location || 'Unknown location',
          uploadedAt: new Date(),
          verified: false, // Requires moderation
        };

        setPhotos((prev) => [...prev, photo]);
        return photo;
      } finally {
        setUploadingPhotos(false);
      }
    },
    [signalementId]
  );

  // Get AI-analysis ready version
  const getAIAnalysisVariant = useCallback((publicId: string) => {
    return cloudinaryService.optimizeForWeb(publicId, 800, 600);
  }, []);

  // Get moderation version with face blur
  const getModerationVariant = useCallback((publicId: string) => {
    return cloudinaryService.blurForPrivacy(publicId, 20);
  }, []);

  return {
    uploadSignalementPhoto,
    getAIAnalysisVariant,
    getModerationVariant,
    photos,
    uploadingPhotos,
  };
};
```

---

## 4. IA Analysis Module - AI Model Input Preparation

### File: `src/features/ia-analysis/services/iaImagePreparation.ts`

Preparing images for AI analysis algorithms.

```typescript
/**
 * Service for preparing images for IA analysis
 */
import { cloudinaryService } from '@/services/cloudinary';

export interface IAAnalysisImage {
  publicId: string;
  originalUrl: string;
  analysisUrl: string;  // Optimized for ML
  faceDetectionUrl: string;
  confidenceThreshold: number;
}

/**
 * Prepare image for facial recognition
 */
export const prepareForFacialRecognition = async (
  publicId: string
): Promise<IAAnalysisImage> => {
  // Optimize for face detection
  const optimized = cloudinaryService.optimizeForWeb(publicId, 1000, 1000);
  
  // Get face-cropped variant
  const faceCropped = cloudinaryService.cropToFace(publicId, 500, 600);

  return {
    publicId,
    originalUrl: cloudinaryService.thumbnail(publicId, 400).url,
    analysisUrl: optimized.url,
    faceDetectionUrl: faceCropped.url,
    confidenceThreshold: 0.85,
  };
};

/**
 * Prepare image for pattern matching
 */
export const prepareForPatternMatching = async (
  publicId: string
): Promise<IAAnalysisImage> => {
  // Full image analysis
  const analyzed = cloudinaryService.optimizeForWeb(publicId, 1280, 1080);
  
  // Grayscale for features
  const features = cloudinaryService.applyEffect(publicId, 'grayscale');

  return {
    publicId,
    originalUrl: analyzed.url,
    analysisUrl: analyzed.url,
    faceDetectionUrl: features.url,
    confidenceThreshold: 0.75,
  };
};

/**
 * Prepare batch of images for IA analysis
 */
export const prepareBatchForAnalysis = async (publicIds: string[]) => {
  return Promise.all(
    publicIds.map((publicId) => prepareForFacialRecognition(publicId))
  );
};
```

---

## 5. Moderation Module - Content Review

### File: `src/features/moderation/hooks/useModerationImages.ts`

Managing images for moderation and verification workflows.

```typescript
/**
 * Hook for moderation image management
 */
import { useState, useCallback } from 'react';
import { cloudinaryService } from '@/services/cloudinary';

export interface ModerationImage {
  publicId: string;
  original: string;
  blurred: string;  // For sensitive content
  thumbnail: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const useModerationImages = () => {
  const [images, setImages] = useState<ModerationImage[]>([]);

  /**
   * Create moderation version of image
   * - Blur sensitive faces
   * - Create thumbnail for quick review
   * - Generate variants for different purposes
   */
  const createModerationImage = useCallback((publicId: string) => {
    const original = cloudinaryService.applyPreset(publicId, 'medium').url;
    const blurred = cloudinaryService.blurForPrivacy(publicId, 30).url;
    const thumbnail = cloudinaryService.thumbnail(publicId, 150).url;

    return {
      publicId,
      original,
      blurred,
      thumbnail,
      status: 'pending' as const,
    };
  }, []);

  /**
   * Get decision-making view
   */
  const getModerationView = useCallback((image: ModerationImage) => {
    return {
      thumbnail: image.thumbnail,
      fullView: image.original,
      blurredView: image.blurred,  // For sensitive verification
      comparison: {
        original: cloudinaryService.applyPreset(image.publicId, 'large'),
        blurred: cloudinaryService.blurForPrivacy(image.publicId, 25),
      },
    };
  }, []);

  const approveImage = useCallback((publicId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.publicId === publicId ? { ...img, status: 'approved' } : img
      )
    );
  }, []);

  const rejectImage = useCallback((publicId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.publicId === publicId ? { ...img, status: 'rejected' } : img
      )
    );
  }, []);

  return {
    images,
    createModerationImage,
    getModerationView,
    approveImage,
    rejectImage,
  };
};
```

---

## 6. Organisations Module - Organization Branding

### File: `src/features/organisations/services/organisationBranding.ts`

Managing logos and branding for organizations.

```typescript
/**
 * Service for organisation branding images
 */
import { cloudinaryService } from '@/services/cloudinary';

export interface OrganisationBranding {
  logo: {
    original: string;
    thumbnail: string;
    avatar: string;
  };
  banner: {
    desktop: string;
    mobile: string;
    thumbnail: string;
  };
}

/**
 * Upload organisation logo
 */
export const uploadOrganisationLogo = async (
  organisationId: string,
  file: File
) => {
  const result = await cloudinaryService.uploadFile(
    file,
    'profilePhoto',  // 5MB limit suitable for logos
    {
      tags: ['organisation', organisationId, 'logo'],
      context: { organisationId },
    }
  );

  if (!result.success) throw new Error(result.error);

  // Create variants
  const original = cloudinaryService.applyPreset(result.publicId!, 'medium').url;
  const thumbnail = cloudinaryService.thumbnail(result.publicId!, 100).url;
  const avatar = cloudinaryService.avatar(result.publicId!, 64).url;

  return {
    publicId: result.publicId!,
    original,
    thumbnail,
    avatar,
  };
};

/**
 * Upload organisation banner
 */
export const uploadOrganisationBanner = async (
  organisationId: string,
  file: File
) => {
  const result = await cloudinaryService.uploadFile(
    file,
    'personnePhoto',  // 10MB for larger banner
    {
      tags: ['organisation', organisationId, 'banner'],
    }
  );

  if (!result.success) throw new Error(result.error);

  // Create responsive variants
  const desktop = cloudinaryService.applyPreset(result.publicId!, 'hero').url;
  const mobile = cloudinaryService.resize(result.publicId!, 600, 300).url;
  const thumbnail = cloudinaryService.thumbnail(result.publicId!, 150).url;

  return {
    publicId: result.publicId!,
    desktop,
    mobile,
    thumbnail,
  };
};
```

---

## Integration Checklist

### Per-Module Integration

- [ ] **Personnes Module**
  - [ ] usePersonnePhotosCloudinary hook
  - [ ] PersonnePhotosPanel component
  - [ ] Save publicId to database

- [ ] **Dossiers Module**
  - [ ] useDossierAttachments hook
  - [ ] DossierAttachmentManager component
  - [ ] File preview component

- [ ] **Signalements Module**
  - [ ] useSignalementPhotos hook
  - [ ] SignalementPhotoUploader component
  - [ ] Location tagging

- [ ] **IA Analysis Module**
  - [ ] iaImagePreparation service
  - [ ] Model input preparation
  - [ ] Batch processing

- [ ] **Moderation Module**
  - [ ] useModerationImages hook
  - [ ] ModerationReview component
  - [ ] Privacy blur controls

- [ ] **Organisations Module**
  - [ ] organisationBranding service
  - [ ] Logo/banner upload
  - [ ] Responsive variants

### Database Schema Additions

Add to existing tables:

```sql
-- personnes table - add
ALTER TABLE personne ADD COLUMN photo_cloudinary_id VARCHAR(255);

-- document table - add
ALTER TABLE document ADD COLUMN cloudinary_id VARCHAR(255);
ALTER TABLE document ADD COLUMN cloudinary_type VARCHAR(50);

-- signalement table - add
ALTER TABLE signalement ADD COLUMN photos_cloudinary_ids JSONB;

-- dossier_disparition - add
ALTER TABLE dossier_disparition ADD COLUMN attachments_cloudinary_ids JSONB;
```

---

## Performance Optimization Tips

### 1. Image Lazy Loading
```typescript
<img
  src={thumbnail}
  loading="lazy"
  alt="..."
/>
```

### 2. Responsive Images
```typescript
const variants = cloudinaryService.getResponsiveUrls(publicId);
<img srcSet={variants.srcSet} sizes="..." alt="" />
```

### 3. Progressive Enhancement
```typescript
// Load thumbnail first, then high-quality
const [imageUrl, setImageUrl] = useState(thumbnail);
useEffect(() => {
  // Load high quality in background
  const img = new Image();
  img.onload = () => setImageUrl(highQuality);
  img.src = highQuality;
}, [highQuality]);
```

### 4. Batch Operations
```typescript
// Upload multiple files at once
const results = await cloudinaryService.uploadMultiple(files, 'personnePhoto');
```

---

**Document Version:** 1.0.0
**Last Updated:** January 19, 2026
**Status:** Production Ready ✅
