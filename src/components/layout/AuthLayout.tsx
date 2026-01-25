import React from 'react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  backgroundImage,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgroundImage
          ? `linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), url(${backgroundImage})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          padding: '3rem',
        }}
      >
        {(title || subtitle) && (
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            {title && (
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.875rem', color: '#1f2937' }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
