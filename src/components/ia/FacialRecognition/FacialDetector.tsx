import React, { useState, useRef, useEffect } from 'react';

export interface FacialDetectorProps {
  onDetect?: (faces: Face[]) => void;
  isLoading?: boolean;
}

interface Face {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export const FacialDetector: React.FC<FacialDetectorProps> = ({ onDetect, isLoading = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faces, setFaces] = useState<Face[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const stopDetection = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsRunning(false);
      setFaces([]);
    }
  };

  const captureFrame = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        // Simulate face detection
        const detectedFaces: Face[] = [
          {
            id: '1',
            x: 50,
            y: 50,
            width: 100,
            height: 120,
            confidence: 0.95,
          },
        ];
        setFaces(detectedFaces);
        if (onDetect) {
          onDetect(detectedFaces);
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={startDetection}
          disabled={isRunning || isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Start Detection
        </button>
        <button
          onClick={stopDetection}
          disabled={!isRunning || isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Stop Detection
        </button>
        <button
          onClick={captureFrame}
          disabled={!isRunning || isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Capture
        </button>
      </div>
      {faces.length > 0 && (
        <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Detected {faces.length} face(s)</p>
          {faces.map((face) => (
            <div key={face.id} style={{ fontSize: '0.875rem', color: '#555' }}>
              Confidence: {(face.confidence * 100).toFixed(2)}%
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
