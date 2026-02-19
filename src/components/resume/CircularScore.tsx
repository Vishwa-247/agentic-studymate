import React from 'react';

interface CircularScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

export const CircularScore: React.FC<CircularScoreProps> = ({ 
  score, 
  size = 'lg',
  label = 'Match Rate',
  showLabel = true
}) => {
  // Dimensions based on size
  const dimensions = {
    sm: { size: 60, stroke: 4, fontSize: 'text-xs' },
    md: { size: 100, stroke: 8, fontSize: 'text-lg' },
    lg: { size: 160, stroke: 12, fontSize: 'text-3xl' }
  };

  const { size: diameter, stroke, fontSize } = dimensions[size];
  const radius = (diameter - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const colorClass = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: diameter, height: diameter }}>
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-gray-200"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={diameter / 2}
            cy={diameter / 2}
          />
          {/* Progress Circle */}
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={diameter / 2}
            cy={diameter / 2}
          />
        </svg>
        {/* Center Text */}
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className={`font-bold ${fontSize} ${colorClass}`}>
            {Math.round(score)}%
          </span>
          {showLabel && size !== 'sm' && (
            <span className="text-gray-500 text-xs uppercase tracking-wider mt-1">
              Match
            </span>
          )}
        </div>
      </div>
      {showLabel && label && (
        <h3 className="mt-4 font-semibold text-gray-700 text-lg">{label}</h3>
      )}
    </div>
  );
};
