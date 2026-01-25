interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  width?: number;
  height?: number;
  title?: string;
  showLegend?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 300,
  title,
  showLegend = true,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`pie-chart ${className}`}>
        <div className="pie-chart-empty">Aucune donnée disponible</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = Math.min(width, height) / 2 - 40;
  const centerX = width / 2;
  const centerY = height / 2;

  let currentAngle = -Math.PI / 2; // Start from top

  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate path for the slice
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;

    const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

    return {
      ...item,
      pathData,
      color,
      percentage
    };
  });

  return (
    <div className={`pie-chart ${className}`}>
      {title && <h3 className="pie-chart-title">{title}</h3>}

      <div className="pie-chart-container">
        <svg width={width} height={height} className="pie-chart-svg">
          {slices.map((slice) => (
            <path
              key={slice.label}
              d={slice.pathData}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
              className="pie-chart-slice"
            />
          ))}

          {/* Center circle for donut effect */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.3}
            fill="white"
            stroke="#e9ecef"
            strokeWidth="1"
          />

          {/* Center text */}
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill="#212529"
          >
            {total}
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize="12"
            fill="#6c757d"
          >
            Total
          </text>
        </svg>

        {showLegend && (
          <div className="pie-chart-legend">
            {slices.map((slice) => (
              <div key={slice.label} className="pie-chart-legend-item">
                <div
                  className="pie-chart-legend-color"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="pie-chart-legend-label">{slice.label}</span>
                <span className="pie-chart-legend-value">
                  {slice.value} ({(slice.percentage * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
