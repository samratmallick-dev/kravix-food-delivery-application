import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i - 12}p`
);

interface HeatmapGridProps {
  /** data[day][hour] = count, day 0=Sun, hour 0=midnight */
  data: number[][];
}

const getColor = (intensity: number): string => {
  if (intensity === 0) return "#F1EFE8";
  if (intensity < 0.2) return "#bfdbfe";
  if (intensity < 0.4) return "#93c5fd";
  if (intensity < 0.6) return "#60a5fa";
  if (intensity < 0.8) return "#3b82f6";
  return "#185FA5";
};

const HeatmapGrid = ({ data }: HeatmapGridProps) => {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; day: number; hour: number; val: number;
  } | null>(null);

  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data</div>
  );

  const allValues = data.flat();
  const max = Math.max(...allValues, 1);

  const cellW = 28;
  const cellH = 20;
  const labelW = 32;
  const labelH = 20;
  const gap = 2;

  return (
    <div className="relative overflow-x-auto">
      <svg
        width={labelW + 24 * (cellW + gap)}
        height={labelH + 7 * (cellH + gap)}
        className="font-mono"
      >
        {/* Hour labels */}
        {HOURS.map((h, hi) => (
          <text
            key={hi}
            x={labelW + hi * (cellW + gap) + cellW / 2}
            y={labelH - 4}
            textAnchor="middle"
            fontSize={8}
            fill="#9ca3af"
          >
            {hi % 3 === 0 ? h : ""}
          </text>
        ))}

        {/* Day rows */}
        {DAYS.map((day, di) => (
          <g key={di}>
            <text
              x={labelW - 4}
              y={labelH + di * (cellH + gap) + cellH / 2 + 4}
              textAnchor="end"
              fontSize={10}
              fill="#6b7280"
            >
              {day}
            </text>
            {HOURS.map((_, hi) => {
              const val = data[di]?.[hi] ?? 0;
              return (
                <rect
                  key={hi}
                  x={labelW + hi * (cellW + gap)}
                  y={labelH + di * (cellH + gap)}
                  width={cellW}
                  height={cellH}
                  rx={3}
                  fill={getColor(val / max)}
                  onMouseEnter={(e) =>
                    setTooltip({ x: e.clientX, y: e.clientY, day: di, hour: hi, val })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  className="cursor-default"
                />
              );
            })}
          </g>
        ))}
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          {DAYS[tooltip.day]} {HOURS[tooltip.hour]} — {tooltip.val} orders
        </div>
      )}
    </div>
  );
};

export default HeatmapGrid;
