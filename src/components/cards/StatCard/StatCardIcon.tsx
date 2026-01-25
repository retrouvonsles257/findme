interface StatCardIconProps {
  icon?: string | React.ReactNode;
  color: string;
}

export const StatCardIcon: React.FC<StatCardIconProps> = ({ icon, color }) => {
  // If icon is a React component (lucide-react icon)
  if (icon && typeof icon !== 'string') {
    return (
      <div
        className="stat-card-icon-component"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        {icon}
      </div>
    );
  }

  if (!icon) {
    return (
      <div
        className="stat-card-icon-default"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px'
        }}
      >
        📊
      </div>
    );
  }

  // If icon is an emoji
  if ((icon as string).length <= 3) {
    return (
      <div
        className="stat-card-icon-emoji"
        style={{
          fontSize: '32px',
          lineHeight: '1'
        }}
      >
        {icon}
      </div>
    );
  }

  // If icon is a URL or path
  return (
    <img
      src={icon as string}
      alt="Stat icon"
      style={{
        width: '40px',
        height: '40px',
        objectFit: 'contain'
      }}
    />
  );
};
