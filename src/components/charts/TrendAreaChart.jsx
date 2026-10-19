import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";

/**
 * Animated gradient area chart for a single time series.
 *
 * @param {{
 *   data: Array<object>,
 *   dataKey: string,          // value field
 *   xKey?: string,            // x-axis label field (default "label")
 *   tooltipLabelKey?: string, // field shown as the tooltip heading
 *   color?: string,
 *   name?: string,            // series name in the tooltip
 *   formatValue?: (n: number) => string,
 *   formatAxis?: (n: number) => string,
 *   height?: number,
 *   animationKey?: string,    // change it to replay the draw animation
 * }} props
 */
export default function TrendAreaChart({
  data,
  dataKey,
  xKey = "label",
  tooltipLabelKey,
  color = "var(--color-emerald-500)",
  name,
  formatValue = (v) => v,
  formatAxis = (v) => v,
  height = 240,
  animationKey,
}) {
  const gradientId = `area-${useId().replace(/:/g, "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart key={animationKey} data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="currentColor" className="text-gray-100 dark:text-gray-700" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          minTickGap={16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          tickFormatter={formatAxis}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
          content={
            <ChartTooltip
              formatValue={formatValue}
              labelFormatter={(label, payload) =>
                tooltipLabelKey ? payload?.[0]?.payload?.[tooltipLabelKey] ?? label : label
              }
            />
          }
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          animationDuration={1100}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
