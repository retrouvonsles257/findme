/**
 * =====================================================
 * RETROUVONSLES - Types pour les Composants
 * =====================================================
 */

export type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export type CardProps = {
  title: string;
  content: string;
  footer?: string;
};
