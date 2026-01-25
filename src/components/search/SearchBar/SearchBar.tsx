import React, { useState, useCallback } from 'react';
import styles from './SearchBar.module.css';
import { SearchBarInput } from './SearchBarInput';
import { SearchBarSuggestions } from './SearchBarSuggestions';

export interface SearchBarSuggestion {
  id: string;
  text: string;
  category?: string;
  icon?: React.ReactNode;
}

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchBarSuggestion) => void;
  suggestions?: SearchBarSuggestion[];
  isLoading?: boolean;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'bordered' | 'filled';
}

/**
 * SearchBar component for search input with suggestions
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  isLoading = false,
  placeholder = 'Search...',
  size = 'medium',
  variant = 'default',
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      setShowSuggestions(true);
      if (value.trim()) {
        onSearch?.(value);
      }
    },
    [onSearch]
  );

  const handleSuggestionSelect = (suggestion: SearchBarSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSuggestionSelect?.(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    onSearch?.('');
  };

  return (
    <div className={styles.searchBar}>
      <SearchBarInput
        value={query}
        onChange={handleChange}
        onClear={handleClear}
        placeholder={placeholder}
        size={size}
        variant={variant}
        isLoading={isLoading}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />

      {showSuggestions && query && (
        <SearchBarSuggestions
          suggestions={suggestions}
          query={query}
          isLoading={isLoading}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )}
    </div>
  );
};
