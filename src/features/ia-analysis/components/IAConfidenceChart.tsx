/**
 * =====================================================
 * RETROUVONSLES - IAConfidenceChart Component
 * Component for displaying confidence scores
 * =====================================================
 */

import React from 'react';
import type { IAConfidenceChartProps } from '../types';

export const IAConfidenceChart: React.FC<IAConfidenceChartProps> = ({
  confidenceScore,
  title = 'Confidence Score',
  showDetails = true,
  className = '',
}) => {
  const getConfidenceColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#3b82f6'; // Blue
    if (score >= 50) return '#f59e0b'; // Amber
    if (score >= 30) return '#ef5350'; // Light Red
    return '#dc2626'; // Red
  };

  const getConfidenceLevel = (score: number): string => {
    if (score >= 90) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 30) return 'Low';
    return 'Very Low';
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (confidenceScore / 100) * circumference;

  return (
    <div className={className}>
      <div style={{ textAlign: 'center' }}>
        <h4>{title}</h4>

        <svg width="120" height="120" style={{ margin: '20px auto' }}>
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={getConfidenceColor(confidenceScore)}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text
            x="60"
            y="70"
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill={getConfidenceColor(confidenceScore)}
          >
            {confidenceScore.toFixed(0)}%
          </text>
        </svg>

        {showDetails && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ marginBottom: '8px', color: '#6b7280' }}>
              <strong>{getConfidenceLevel(confidenceScore)}</strong>
            </p>
            {confidenceScore < 70 && (
              <p style={{ fontSize: '12px', color: '#ef5350' }}>
                ⚠️ Low confidence - results may be unreliable
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
