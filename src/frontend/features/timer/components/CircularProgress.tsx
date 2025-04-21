import React from "react";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  value: number; // percent (0-100)
  color?: string;
  trailColor?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 220,
  strokeWidth = 10,
  value,
  color = "#ff4b2b",
  trailColor = "#2a2a2a",
  children,
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trailColor}
        strokeWidth={strokeWidth}
        opacity={0.25}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)" }}
      />
      {children && (
        <foreignObject x={0} y={0} width={size} height={size}>
          <div className="flex flex-col items-center justify-center w-full h-full">{children}</div>
        </foreignObject>
      )}
    </svg>
  );
};
