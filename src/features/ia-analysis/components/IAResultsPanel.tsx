/**
 * =====================================================
 * RETROUVONSLES - IAResultsPanel Component
 * Component for displaying IA analysis results
 * =====================================================
 */

import React from 'react';
import type { IAResultsPanelProps } from '../types';
import styles from './IAResultsPanel.module.css';

export const IAResultsPanel: React.FC<IAResultsPanelProps> = ({
  results,
  type,
  className = '',
}) => {
  if (!results) {
    return <div className={`${styles.container} ${className}`}>{styles.noData}</div>;
  }

  const renderFacialResults = () => {
    if (!('facial_features' in results)) return null;
    return (
      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Facial Features</h4>
          <div className={styles.details}>
            <p>
              <span>Confidence:</span>
              <strong>{results.facial_features.confidence_facial.toFixed(2)}%</strong>
            </p>
            <p>
              <span>Face Quality:</span>
              <strong>{results.facial_features.face_quality.toFixed(2)}%</strong>
            </p>
            {results.facial_features.age_estimated && (
              <p>
                <span>Age:</span>
                <strong>{results.facial_features.age_estimated}</strong>
              </p>
            )}
            {results.facial_features.gender && (
              <p>
                <span>Gender:</span>
                <strong>{results.facial_features.gender}</strong>
              </p>
            )}
          </div>
        </div>

        {results.best_match && (
          <div className={styles.section}>
            <h4>Best Match</h4>
            <div className={styles.match}>
              <p>
                <span>Person ID:</span>
                <strong>{results.best_match.person_id}</strong>
              </p>
              <p>
                <span>Similarity:</span>
                <strong className={styles.score}>{results.best_match.similarity.toFixed(2)}%</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComparisonResults = () => {
    if (!('is_same_person' in results)) return null;
    return (
      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Comparison Results</h4>
          <div className={styles.details}>
            <p>
              <span>Overall Similarity:</span>
              <strong className={results.is_same_person ? styles.match : styles.nomatch}>
                {results.similarity_score.toFixed(2)}%
              </strong>
            </p>
            <p>
              <span>Facial Match:</span>
              <strong>{results.facial_match_confidence.toFixed(2)}%</strong>
            </p>
            <p>
              <span>Structural Similarity:</span>
              <strong>{results.structural_similarity.toFixed(2)}%</strong>
            </p>
            <p>
              <span>Result:</span>
              <strong className={results.is_same_person ? styles.match : styles.nomatch}>
                {results.is_same_person ? 'Same Person' : 'Different Person'}
              </strong>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationResults = () => {
    if (!('last_known_location' in results)) return null;
    return (
      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Last Known Location</h4>
          <div className={styles.details}>
            <p>
              <span>Address:</span>
              <strong>{results.last_known_location.address}</strong>
            </p>
            <p>
              <span>Date:</span>
              <strong>{new Date(results.last_known_location.date).toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Movement Pattern</h4>
          <div className={styles.details}>
            <p>
              <span>Type:</span>
              <strong>{results.movement_pattern.type}</strong>
            </p>
            <p>
              <span>Confidence:</span>
              <strong>{results.movement_pattern.confidence.toFixed(2)}%</strong>
            </p>
          </div>
        </div>

        {results.predicted_locations.length > 0 && (
          <div className={styles.section}>
            <h4>Predicted Locations</h4>
            <ul className={styles.locationList}>
              {results.predicted_locations.map((loc: any, idx: number) => (
                <li key={idx}>
                  <span className={styles.probability}>{loc.probability.toFixed(0)}%</span>
                  <span className={styles.reason}>{loc.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSimilaritiesResults = () => {
    if (!('matches' in results)) return null;
    return (
      <div className={styles.content}>
        <div className={styles.section}>
          <h4>Similarity Matches ({results.matches.length})</h4>
          <ul className={styles.matchesList}>
            {results.matches.map((match: any) => (
              <li key={match.person_id}>
                <span className={styles.name}>{match.name}</span>
                <span className={styles.score}>{match.similarity_score.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const contentMap = {
    facial: renderFacialResults,
    comparison: renderComparisonResults,
    location: renderLocationResults,
    similarities: renderSimilaritiesResults,
  };

  const renderContent = contentMap[type];

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Analysis Results - {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <span className={styles.date}>{new Date().toLocaleDateString()}</span>
      </div>
      {renderContent ? renderContent() : <div className={styles.noData}>No data available</div>}
    </div>
  );
};
