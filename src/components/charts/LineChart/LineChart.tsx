interface LineChartData {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: LineChartData[];
  width?: number;
  height?: number;
  title?: string;
  showPoints?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 400,
  height = 300,
  title,
  showPoints = true,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`line-chart ${className}`}>
        <div className="line-chart-empty">Aucune donnée disponible</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const chartHeight = height - 60;
  const chartWidth = width - 60;

  const getPointPosition = (index: number, value: number) => {
    const x = 50 + (index / (data.length - 1)) * chartWidth;
    const y = 20 + ((maxValue - value) / (maxValue - minValue)) * chartHeight;
    return { x, y };
  };

  const pathData = data
    .map((item, index) => {
      const { x, y } = getPointPosition(index, item.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className={`line-chart ${className}`}>
      {title && <h3 className="line-chart-title">{title}</h3>}

      <svg width={width} height={height} className="line-chart-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = 20 + ratio * chartHeight;
          const value = maxValue - ratio * (maxValue - minValue);
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
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#007bff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="line-chart-line"
        />

        {/* Points */}
        {showPoints && data.map((item, index) => {
          const { x, y } = getPointPosition(index, item.value);
          const color = item.color || '#007bff';

          return (
            <circle
              key={item.label}
              cx={x}
              cy={y}
              r="6"
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="line-chart-point"
            />
          );
        })}

        {/* Labels */}
        {data.map((item, index) => {
          const { x } = getPointPosition(index, item.value);
          return (
            <text
              key={item.label}
              x={x}
              y={height - 20}
              textAnchor="middle"
              fontSize="11"
              fill="#6c757d"
              transform={`rotate(-45, ${x}, ${height - 20})`}
            >
              {item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
