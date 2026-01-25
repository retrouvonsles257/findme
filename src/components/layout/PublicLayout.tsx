import React from 'react';

export interface PublicLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hero?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  header,
  children,
  footer,
  hero,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {header}

      {hero && (
        <section
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          {hero}
        </section>
      )}

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem' }}>
        {children}
      </main>

      {footer && (
        <footer>
          {footer}
        </footer>
      )}
    </div>
  );
};
