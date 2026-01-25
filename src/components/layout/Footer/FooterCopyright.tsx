import React from 'react';

export interface FooterCopyrightProps {
  year?: number;
  companyName: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
}

export const FooterCopyright: React.FC<FooterCopyrightProps> = ({
  year = new Date().getFullYear(),
  companyName,
  links = [],
}) => {
  return (
    <div
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '2rem',
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
        © {year} {companyName}. All rights reserved.
      </div>

      {links.length > 0 && (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end' }}>
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLAnchorElement).style.color = 'white';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLAnchorElement).style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
