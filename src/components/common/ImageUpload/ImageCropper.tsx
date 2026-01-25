import React, { useState, useRef, useEffect } from 'react';
import styles from './ImageUpload.module.css';

export interface ImageCropperProps {
  imageUrl: string;
  aspectRatio?: number;
  onCrop: (file: File) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  aspectRatio,
  onCrop,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(x, rect.width - prev.width)),
      y: Math.max(0, Math.min(y, rect.height - prev.height)),
    }));
  };

  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      imageRef.current,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
        onCrop(file);
      }
    });
  };

  return (
    <div className={styles.cropperContainer}>
      <div
        className={styles.cropperArea}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop image"
          className={styles.cropperImage}
          draggable={false}
        />
        <div
          className={styles.cropBox}
          style={{
            left: `${cropArea.x}px`,
            top: `${cropArea.y}px`,
            width: `${cropArea.width}px`,
            height: `${cropArea.height}px`,
          }}
        />
      </div>

      <div className={styles.cropperActions}>
        <button className={styles.cancelButton} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className={styles.cropButton} onClick={handleCrop} type="button">
          Crop
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};
