import React from 'react';
import styles from './FilterPanel.module.css';
import { FilterGroup } from './FilterGroup';
import { FilterItem } from './FilterItem';

export interface FilterPanelFilter {
  id: string;
  name: string;
  items: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
}

export interface FilterPanelProps {
  filters: FilterPanelFilter[];
  selectedFilters?: Record<string, string[]>;
  onFilterChange?: (filterId: string, itemId: string, checked: boolean) => void;
  onClearAll?: () => void;
}

/**
 * FilterPanel component for sidebar filter controls
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  selectedFilters = {},
  onFilterChange,
  onClearAll,
}) => {
  const selectedCount = Object.values(selectedFilters).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <aside className={styles.filterPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Filters</h3>
        {selectedCount > 0 && (
          <button className={styles.clearButton} onClick={onClearAll}>
            Clear ({selectedCount})
          </button>
        )}
      </div>

      <div className={styles.content}>
        {filters.map((filter) => (
          <FilterGroup key={filter.id} filter={filter}>
            {filter.items.map((item) => (
              <FilterItem
                key={item.id}
                id={item.id}
                label={item.label}
                count={item.count}
                checked={selectedFilters[filter.id]?.includes(item.id) || false}
                onChange={(checked) =>
                  onFilterChange?.(filter.id, item.id, checked)
                }
              />
            ))}
          </FilterGroup>
        ))}
      </div>
    </aside>
  );
};
