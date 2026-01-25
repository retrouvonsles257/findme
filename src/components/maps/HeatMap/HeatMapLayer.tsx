import React, { useEffect, useRef } from 'react';

export interface HeatMapLayerProps {
  data: Array<{ lat: number; lng: number; intensity: number }>;
  center: [number, number];
  zoom: number;
  gradient: string[];
  radius: number;
  blur: number;
  maxZoom: number;
  minOpacity: number;
}

/**
 * HeatMapLayer component - renders heat map visualization
 */
export const HeatMapLayer: React.FC<HeatMapLayerProps> = ({
  data,
  center,
  zoom,
  gradient,
  radius,
  blur,
  maxZoom,
  minOpacity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get intensity range
    const intensities = data.map(p => p.intensity);
    const minIntensity = Math.min(...intensities);
    const maxIntensity = Math.max(...intensities);
    const intensityRange = maxIntensity - minIntensity || 1;

    // Draw each data point
    data.forEach(point => {
      const intensity = (point.intensity - minIntensity) / intensityRange;
      const alpha = minOpacity + intensity * (1 - minOpacity);

      // Simple projection for demo (latitude/longitude to canvas coordinates)
      const x = ((point.lng + 180) / 360) * canvas.width;
      const y = ((90 - point.lat) / 180) * canvas.height;

      // Draw gradient circle
      const canvasGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const colorIdx = Math.floor(intensity * (gradient.length - 1));

      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, radius, blur, minOpacity]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};
