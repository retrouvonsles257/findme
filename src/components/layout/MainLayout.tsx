import React from 'react';

export interface MainLayoutProps {
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hasSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  header,
  sidebar,
  children,
  footer,
  hasSidebar = true,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {header}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasSidebar ? '280px 1fr' : '1fr',
          flex: 1,
          gap: 0,
        }}
      >
        {sidebar && hasSidebar && (
          <aside style={{ borderRight: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {sidebar}
          </aside>
        )}

        <main
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#f9fafb',
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {children}
          </div>
        </main>
      </div>

      {footer && (
        <footer style={{ borderTop: '1px solid #e5e7eb' }}>
          {footer}
        </footer>
      )}
    </div>
  );
};
