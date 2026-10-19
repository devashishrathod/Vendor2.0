import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";

/**
 * Animated horizontal ranking bars (e.g. top vouchers, outlets).
 *
 * @param {{
 *   data: Array<{ label: string, value: number }>,
 *   color?: string,
 *   name?: string,
 *   formatValue?: (n: number) => string,
 *   barSize?: number,
 * }} props
 */
export default function HorizontalBarChart({ data, color = "var(--color-emerald-500)", name, formatValue = (v) => v, barSize = 14 }) {
  const height = Math.max(120, data.length * (barSize + 22));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
        />
        <Tooltip cursor={{ fill: "rgba(16,185,129,0.06)" }} content={<ChartTooltip formatValue={formatValue} />} />
        <Bar
          dataKey="value"
          name={name}
          barSize={barSize}
          radius={[0, 8, 8, 0]}
          background={{ fill: "rgba(156,163,175,0.12)", radius: 8 }}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {data.map((d, i) => (
            <Cell key={d.label} fill={color} fillOpacity={1 - i * 0.12} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={formatValue}
            className="fill-gray-600 dark:fill-gray-300"
            fontSize={11}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
