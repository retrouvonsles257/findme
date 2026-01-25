interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  width?: number;
  height?: number;
  title?: string;
  showValues?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 400,
  height = 300,
  title,
  showValues = false,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bar-chart ${className}`}>
        <div className="bar-chart-empty">Aucune donnée disponible</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const barWidth = (width - 60) / data.length;
  const chartHeight = height - 60;

  return (
    <div className={`bar-chart ${className}`}>
      {title && <h3 className="bar-chart-title">{title}</h3>}

      <svg width={width} height={height} className="bar-chart-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = 20 + (1 - ratio) * chartHeight;
          return (
            <g key={ratio}>
              <line
                x1="40"
                y1={y}
                x2={width - 20}
                y2={y}
                stroke="#e9ecef"
                strokeWidth="1"
              />
              <text
                x="35"
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6c757d"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = 50 + index * barWidth;
          const y = height - 40 - barHeight;
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth - 4}
                height={barHeight}
                fill={color}
                rx="2"
                className="bar-chart-bar"
              />

              {showValues && (
                <text
                  x={x + (barWidth - 4) / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#212529"
                >
                  {item.value}
                </text>
              )}

              {/* Label */}
              <text
                x={x + (barWidth - 4) / 2}
                y={height - 20}
                textAnchor="middle"
                fontSize="11"
                fill="#6c757d"
                transform={`rotate(-45, ${x + (barWidth - 4) / 2}, ${height - 20})`}
              >
                {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
