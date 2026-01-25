interface TrendData {
  value: number;
  isPositive: boolean;
}

interface StatCardValueProps {
  value: number | string;
  trend?: TrendData;
}

export const StatCardValue: React.FC<StatCardValueProps> = ({ value, trend }) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const formatTrend = (trend: TrendData): string => {
    const sign = trend.isPositive ? '+' : '';
    return `${sign}${trend.value}%`;
  };

  return (
    <div className="stat-card-value">
      <div
        className="stat-value"
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#212529',
          lineHeight: '1.2'
        }}
      >
        {formatValue(value)}
      </div>

      {trend && (
        <div
          className="stat-trend"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontWeight: '500',
            color: trend.isPositive ? '#28a745' : '#dc3545',
            marginTop: '4px'
          }}
        >
          <span className="trend-icon">
            {trend.isPositive ? '↗️' : '↘️'}
          </span>
          <span className="trend-value">
            {formatTrend(trend)}
          </span>
        </div>
      )}
    </div>
  );
};
