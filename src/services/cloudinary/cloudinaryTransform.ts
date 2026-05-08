/**
 * =====================================================
 * RETROUVONSLES - Cloudinary Transformation Service
 * =====================================================
 * Image transformations and optimizations
 */

import {
  cloudinaryConfig,
  CloudinaryTransformation,
  buildCloudinaryUrl,
  TRANSFORMATION_PRESETS,
  extractPublicId,
} from './cloudinaryConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'pad' | 'crop' | 'scale' | 'limit';
  gravity?: 'center' | 'face' | 'auto' | 'north' | 'south' | 'east' | 'west';
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'gif';
  radius?: number | string;
  background?: string;
  angle?: number;
  opacity?: number;
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  effect?: string;
  dpr?: 'auto' | number;
  density?: number;
  page?: number;
  delay?: number;
  flags?: string;
}

export interface TransformedUrl {
  url: string;
  secureUrl: string;
  publicId: string;
  originalUrl: string;
  transformations: CloudinaryTransformation;
}

// ============================================
// TRANSFORMATION UTILITIES
// ============================================

/**
 * Apply transformations to an image
 */
export const transformImage = (
  publicId: string,
  transformations: CloudinaryTransformation
): TransformedUrl => {
  const url = buildCloudinaryUrl(publicId, transformations);
  const secureUrl = url.replace('http://', 'https://');

  return {
    url,
    secureUrl,
    publicId,
    originalUrl: buildCloudinaryUrl(publicId),
    transformations,
  };
};

/**
 * Apply preset transformation
 */
export const applyPreset = (
  publicId: string,
  preset: keyof typeof TRANSFORMATION_PRESETS
): TransformedUrl => {
  const transformation = TRANSFORMATION_PRESETS[preset];
  return transformImage(publicId, transformation);
};

/**
 * Resize image while maintaining aspect ratio
 */
export const resize = (
  publicId: string,
  width: number,
  height: number
): TransformedUrl => {
  return transformImage(publicId, {
    width,
    height,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Create thumbnail
 */
export const thumbnail = (
  publicId: string,
  size: number = 150
): TransformedUrl => {
  return transformImage(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Create avatar (circular)
 */
export const avatar = (
  publicId: string,
  size: number = 200
): TransformedUrl => {
  return transformImage(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    radius: 'max',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Create responsive srcset for images
 */
export const createSrcSet = (
  publicId: string,
  maxWidth: number = 1200,
  sizes: number[] = [320, 640, 960, 1280]
): string => {
  const validSizes = sizes.filter((size) => size <= maxWidth);

  return validSizes
    .map((size) => {
      const url = buildCloudinaryUrl(publicId, {
        width: size,
        crop: 'fit',
        quality: 'auto',
        fetch_format: 'auto',
        dpr: 'auto',
      });
      return `${url} ${size}w`;
    })
    .join(', ');
};

/**
 * Get multiple responsive URLs
 */
export const getResponsiveUrls = (
  publicId: string,
  sizes: { name: string; width: number; height?: number }[] = [
    { name: 'thumbnail', width: 150 },
    { name: 'small', width: 300 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 },
  ]
): Record<string, string> => {
  const urls: Record<string, string> = {};

  sizes.forEach(({ name, width, height }) => {
    urls[name] = buildCloudinaryUrl(publicId, {
      width,
      height,
      crop: 'fit',
      quality: 'auto',
      fetch_format: 'auto',
    });
  });

  return urls;
};

/**
 * Optimize image for web
 */
export const optimizeForWeb = (
  publicId: string,
  width?: number,
  height?: number
): TransformedUrl => {
  return transformImage(publicId, {
    width,
    height,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
    dpr: 'auto',
    flags: 'progressive',
  });
};

/**
 * Convert image format
 */
export const convertFormat = (
  publicId: string,
  format: 'jpg' | 'png' | 'webp' | 'gif',
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' | number
): TransformedUrl => {
  const formatMap: Record<string, string> = {
    jpg: 'jpg',
    jpeg: 'jpg',
    png: 'png',
    webp: 'webp',
    gif: 'gif',
  };

  return transformImage(publicId, {
    fetch_format: formatMap[format] as any,
    quality: quality || 'auto',
  });
};

/**
 * Apply filters and effects
 */
export const applyEffect = (
  publicId: string,
  effect: 'grayscale' | 'sepia' | 'blur' | 'pixelate' | 'oil_paint' | 'cartoonify',
  intensity?: number
): TransformedUrl => {
  const effectMap: Record<string, string> = {
    grayscale: 'grayscale',
    sepia: 'sepia',
    blur: `blur:${intensity || 300}`,
    pixelate: 'pixelate',
    oil_paint: `oil_paint`,
    cartoonify: 'cartoonify',
  };

  return transformImage(publicId, {
    effect: effectMap[effect] as any,
    quality: 'auto',
  });
};

/**
 * Blur for privacy (faces/text)
 */
export const blurForPrivacy = (
  publicId: string,
  intensity: number = 300
): TransformedUrl => {
  return transformImage(publicId, {
    effect: `blur:${intensity}` as any,
    quality: 'auto',
  });
};

/**
 * Pixelate for privacy (faces/text)
 */
export const pixelateForPrivacy = (publicId: string): TransformedUrl => {
  return transformImage(publicId, {
    effect: 'pixelate' as any,
    quality: 'auto',
  });
};

/**
 * Detect and blur faces
 */
export const autoBlurFaces = (publicId: string): TransformedUrl => {
  return transformImage(publicId, {
    effect: 'blur:500' as any,
    flags: 'region_relative',
    gravity: 'face',
    quality: 'auto',
  });
};

/**
 * Extract face from image
 */
export const cropToFace = (
  publicId: string,
  width?: number,
  height?: number
): TransformedUrl => {
  return transformImage(publicId, {
    width,
    height,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Add border to image
 */
export const addBorder = (
  publicId: string,
  width: number = 2,
  color: string = '000000',
  radius?: number
): TransformedUrl => {
  return transformImage(publicId, {
    border: `${width}px_solid_${color}` as any,
    radius,
    quality: 'auto',
  });
};

/**
 * Add shadow effect
 */
export const addShadow = (publicId: string): TransformedUrl => {
  return transformImage(publicId, {
    effect: 'shadow',
    quality: 'auto',
  });
};

/**
 * Apply rotation
 */
export const rotate = (publicId: string, degrees: number): TransformedUrl => {
  return transformImage(publicId, {
    angle: degrees,
    quality: 'auto',
  });
};

/**
 * Adjust brightness/contrast/saturation
 */
export const adjustColors = (
  publicId: string,
  brightness?: number,
  contrast?: number,
  saturation?: number
): TransformedUrl => {
  const transformation: CloudinaryTransformation = {
    quality: 'auto',
  };

  if (brightness !== undefined) {
    transformation.brightness = brightness;
  }
  if (contrast !== undefined) {
    transformation.contrast = contrast;
  }
  if (saturation !== undefined) {
    transformation.saturation = saturation;
  }

  return transformImage(publicId, transformation);
};

/**
 * Create watermark
 */
export const addWatermark = (
  publicId: string,
  watermarkPublicId: string,
  gravity?: 'center' | 'north_west' | 'north' | 'north_east' | 'west' | 'east' | 'south_west' | 'south' | 'south_east',
  opacity?: number
): TransformedUrl => {
  const transformation: CloudinaryTransformation = {
    overlay: watermarkPublicId,
    gravity: gravity || 'south_east',
    quality: 'auto',
  };

  if (opacity !== undefined) {
    transformation.opacity = opacity;
  }

  return transformImage(publicId, transformation);
};

/**
 * Create image with text overlay
 */
export const addTextOverlay = (
  publicId: string,
  text: string,
  color: string = 'FFFFFF',
  fontSize?: number,
  gravity?: string
): TransformedUrl => {
  const gravityValue = (gravity || 'south') as 'center' | 'face' | 'auto' | 'north' | 'south' | 'east' | 'west' | 'north_west' | 'north_east' | 'south_west' | 'south_east';
  return transformImage(publicId, {
    overlay: `text:Arial_${fontSize || 20}_${color}:${encodeURIComponent(text)}`,
    gravity: gravityValue,
    quality: 'auto',
  });
};

/**
 * Combine multiple transformations
 */
export const chainTransformations = (
  publicId: string,
  transformations: CloudinaryTransformation[]
): TransformedUrl => {
  // Note: For Cloudinary API, multiple transformations are separated by slashes
  // This is a simplified version - for complex chains, use the URL building directly
  if (transformations.length === 0) {
    return transformImage(publicId, {});
  }

  // Merge all transformations (simplified)
  const merged: CloudinaryTransformation = {};
  transformations.forEach((t) => {
    Object.assign(merged, t);
  });

  return transformImage(publicId, merged);
};

/**
 * Build transformation URL from options object
 */
export const buildTransformUrl = (
  publicId: string,
  options: TransformOptions
): TransformedUrl => {
  const transformation: CloudinaryTransformation = {};

  if (options.width) transformation.width = options.width;
  if (options.height) transformation.height = options.height;
  if (options.crop) transformation.crop = options.crop;
  if (options.gravity) transformation.gravity = options.gravity;
  if (options.quality) transformation.quality = options.quality;
  if (options.format) transformation.fetch_format = options.format;
  if (options.radius !== undefined) transformation.radius = options.radius;
  if (options.background) transformation.background = options.background;
  if (options.angle) transformation.angle = options.angle;
  if (options.opacity) transformation.opacity = options.opacity;
  if (options.blur) transformation.blur = options.blur;
  if (options.brightness) {
    // Using effect for brightness adjustment
    transformation.brightness = options.brightness;
  }
  if (options.contrast) transformation.contrast = options.contrast;
  if (options.saturation) transformation.saturation = options.saturation;
  if (options.hue) {
    // Custom effect for hue
    transformation.hue = options.hue;
  }
  if (options.effect) transformation.effect = options.effect;
  if (options.dpr) transformation.dpr = options.dpr;
  if (options.density) transformation.density = options.density;
  if (options.page) transformation.page = options.page;
  if (options.delay) transformation.delay = options.delay;
  if (options.flags) transformation.flags = options.flags;

  return transformImage(publicId, transformation);
};

/**
 * Get image metadata (uses Cloudinary API with signed requests)
 */
export const getImageMetadata = async (
  publicId: string
): Promise<Record<string, any> | null> => {
  try {
    if (!cloudinaryConfig.cloudName) {

      return null;
    }

    // Note: This requires server-side API calls with authentication
    // Client-side won't work without exposing API secrets

    return null;
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
};

/**
 * Delete image from Cloudinary (requires API key)
 */
export const deleteImage = async (
  publicId: string,
  resourceType: string = 'image'
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey) {
      return {
        success: false,
        error: 'Cloudinary is not properly configured',
      };
    }

    // Note: This is a simplified version
    // Proper deletion requires server-side API calls with authentication

    return {
      success: false,
      error: 'Image deletion must be done server-side',
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Create optimized image variants for responsive design
 */
export const createImageVariants = (
  publicId: string,
  baseWidth: number = 800,
  baseHeight: number = 600
): {
  original: string;
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  srcSet: string;
} => {
  return {
    original: buildCloudinaryUrl(publicId),
    thumbnail: buildCloudinaryUrl(publicId, {
      width: 150,
      height: 150,
      crop: 'thumb',
      quality: 'auto',
      fetch_format: 'auto',
    }),
    small: buildCloudinaryUrl(publicId, {
      width: 300,
      height: 225,
      crop: 'fit',
      quality: 'auto',
      fetch_format: 'auto',
    }),
    medium: buildCloudinaryUrl(publicId, {
      width: baseWidth,
      height: baseHeight,
      crop: 'fit',
      quality: 'auto',
      fetch_format: 'auto',
    }),
    large: buildCloudinaryUrl(publicId, {
      width: 1200,
      height: 900,
      crop: 'fit',
      quality: 'auto',
      fetch_format: 'auto',
    }),
    srcSet: createSrcSet(publicId, baseWidth),
  };
};

// ============================================
// EXPORTS
// ============================================

export type { CloudinaryTransformation };
