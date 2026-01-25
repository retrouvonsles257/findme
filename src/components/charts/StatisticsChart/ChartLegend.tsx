interface ChartLegendData {
  label: string;
  value: number;
  color?: string;
}

interface ChartLegendProps {
  data: ChartLegendData[];
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-legend">
      <h4 className="chart-legend-title">Légende</h4>

      <div className="chart-legend-items">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

          return (
            <div key={item.label} className="chart-legend-item">
              <div
                className="chart-legend-color"
                style={{ backgroundColor: color }}
              />

              <div className="chart-legend-info">
                <span className="chart-legend-label">{item.label}</span>
                <span className="chart-legend-details">
                  {item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-legend-total">
        <span className="chart-legend-total-label">Total:</span>
        <span className="chart-legend-total-value">{total.toLocaleString()}</span>
      </div>
    </div>
  );
};
