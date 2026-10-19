import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";

/**
 * Animated donut with a centered total.
 *
 * @param {{
 *   data: Array<{ label: string, value: number, color: string }>,
 *   centerValue?: React.ReactNode,
 *   centerLabel?: string,
 *   size?: number,
 *   formatValue?: (n: number) => string,
 * }} props
 */
export default function DonutChart({ data, centerValue, centerLabel, size = 160, formatValue = (v) => v }) {
  const hasData = data.some((d) => d.value > 0);
  const chartData = hasData ? data : [{ label: "No data", value: 1, color: "#e5e7eb" }];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius="72%"
            outerRadius="100%"
            paddingAngle={hasData && data.length > 1 ? 3 : 0}
            cornerRadius={6}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          {hasData && <Tooltip content={<ChartTooltip formatValue={formatValue} />} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{centerValue}</span>
        {centerLabel && <span className="text-[10px] text-gray-400">{centerLabel}</span>}
      </div>
    </div>
  );
}
