import React from 'react';

export interface FooterSocialProps {
  platforms: Array<{
    name: string;
    url: string;
    icon: React.ReactNode;
  }>;
}

export const FooterSocial: React.FC<FooterSocialProps> = ({ platforms }) => {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {platforms.map((platform, index) => (
        <a
          key={index}
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          title={platform.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = 'rgba(255, 255, 255, 0.2)';
            el.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.background = 'rgba(255, 255, 255, 0.1)';
            el.style.transform = 'translateY(0)';
          }}
        >
          {platform.icon}
        </a>
      ))}
    </div>
  );
};
