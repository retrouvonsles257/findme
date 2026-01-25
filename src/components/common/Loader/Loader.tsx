import styles from './Loader.module.css';

export type LoaderSize = 'sm' | 'md' | 'lg';
export type LoaderVariant = 'spinner' | 'dots' | 'pulse';

export interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  color?: string;
  className?: string;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  color = '#007bff',
  className = '',
  text
}) => {
  const loaderClasses = [
    styles.loader,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const style = { '--loader-color': color } as React.CSSProperties;

  return (
    <div className={styles.loaderWrapper} style={style}>
      <div className={loaderClasses}>
        {variant === 'dots' && (
          <>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </>
        )}
      </div>
      {text && <div className={styles.loaderText}>{text}</div>}
    </div>
  );
};
