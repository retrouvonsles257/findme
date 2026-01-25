import React from 'react';

export interface FooterLinksProps {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export const FooterLinks: React.FC<FooterLinksProps> = ({ title, links }) => {
  return (
    <div>
      <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>
        {title}
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {links.map((link, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>
            <a
              href={link.href}
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                fontSize: '0.875rem',
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
          </li>
        ))}
      </ul>
    </div>
  );
};
