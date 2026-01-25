import React, { useMemo } from 'react';
import styles from './SearchBar.module.css';
import { SearchBarSuggestion } from './SearchBar';

export interface SearchBarSuggestionsProps {
  suggestions: SearchBarSuggestion[];
  query: string;
  isLoading?: boolean;
  onSuggestionSelect?: (suggestion: SearchBarSuggestion) => void;
}

/**
 * SearchBarSuggestions component - suggestion dropdown
 */
export const SearchBarSuggestions: React.FC<SearchBarSuggestionsProps> = ({
  suggestions,
  query,
  isLoading = false,
  onSuggestionSelect,
}) => {
  const filteredSuggestions = useMemo(() => {
    const q = query.toLowerCase();
    return suggestions.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
    );
  }, [suggestions, query]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, SearchBarSuggestion[]> = {};
    filteredSuggestions.forEach((s) => {
      const category = s.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(s);
    });
    return groups;
  }, [filteredSuggestions]);

  return (
    <div className={styles.suggestionsContainer}>
      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className={styles.empty}>
          <p>No suggestions found</p>
        </div>
      ) : (
        Object.entries(groupedByCategory).map(([category, items]) => (
          <div key={category}>
            {category !== 'Other' && (
              <div className={styles.suggestionCategory}>{category}</div>
            )}
            <ul className={styles.suggestionsList}>
              {items.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    className={styles.suggestionItem}
                    onClick={() => onSuggestionSelect?.(suggestion)}
                  >
                    {suggestion.icon && (
                      <span className={styles.suggestionIcon}>
                        {suggestion.icon}
                      </span>
                    )}
                    <span className={styles.suggestionText}>
                      {suggestion.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};
