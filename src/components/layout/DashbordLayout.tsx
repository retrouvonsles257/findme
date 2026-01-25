import React from 'react';

export interface DashboardLayoutProps {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  sidebar,
  children,
  footer,
  rightPanel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {header}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: rightPanel ? '280px 1fr 320px' : '280px 1fr',
          flex: 1,
          gap: 0,
          overflow: 'hidden',
        }}
      >
        <aside
          style={{
            borderRight: '1px solid #e5e7eb',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {sidebar}
        </aside>

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

        {rightPanel && (
          <aside
            style={{
              borderLeft: '1px solid #e5e7eb',
              background: 'white',
              overflow: 'auto',
              padding: '1rem',
            }}
          >
            {rightPanel}
          </aside>
        )}
      </div>

      {footer && (
        <footer style={{ borderTop: '1px solid #e5e7eb' }}>
          {footer}
        </footer>
      )}
    </div>
  );
};
