import { ChartLegend } from './ChartLegend';

interface StatisticsChartData {
  label: string;
  value: number;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatisticsChartProps {
  data: StatisticsChartData[];
  title?: string;
  showLegend?: boolean;
  className?: string;
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  data,
  title,
  showLegend = true,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`statistics-chart ${className}`}>
        <div className="statistics-chart-empty">Aucune donnée disponible</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className={`statistics-chart ${className}`}>
      {title && <h3 className="statistics-chart-title">{title}</h3>}

      <div className="statistics-chart-content">
        <div className="statistics-chart-bars">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

            return (
              <div key={item.label} className="statistics-chart-item">
                <div className="statistics-chart-label">
                  {item.label}
                </div>

                <div className="statistics-chart-bar-container">
                  <div
                    className="statistics-chart-bar"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  />

                  <div className="statistics-chart-value">
                    {item.value.toLocaleString()}
                  </div>
                </div>

                {item.trend && (
                  <div className={`statistics-chart-trend ${item.trend.isPositive ? 'positive' : 'negative'}`}>
                    <span className="trend-icon">
                      {item.trend.isPositive ? '↗' : '↘'}
                    </span>
                    <span className="trend-value">
                      {Math.abs(item.trend.value)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showLegend && <ChartLegend data={data} />}
      </div>
    </div>
  );
};
