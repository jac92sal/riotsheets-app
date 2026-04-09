import React from 'react';
import { Guitar } from 'lucide-react';

interface CircularTimerProps {
  isRecording: boolean;
  timeLeft: number;
  maxTime: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  isRecording,
  timeLeft,
  maxTime,
  onStart,
  onStop,
  disabled = false
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = ((maxTime - timeLeft) / maxTime) * circumference;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* SVG Progress Ring */}
        <svg
          width="120"
          height="120"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="hsl(var(--border))"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="hsl(var(--secondary))"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-300"
            style={{
              filter: isRecording ? 'drop-shadow(0 0 8px hsl(var(--secondary)))' : 'none'
            }}
          />
        </svg>

        {/* Center Button */}
        <button
          onClick={isRecording ? onStop : onStart}
          disabled={disabled}
          className={`absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 transform ${
            isRecording
              ? 'animate-pulse scale-110'
              : 'hover:scale-110'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            background: isRecording 
              ? 'linear-gradient(135deg, hsl(var(--destructive)), hsl(0 84% 70%))' 
              : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
            boxShadow: isRecording 
              ? '0 0 30px hsl(var(--destructive) / 0.8), inset 0 2px 20px rgba(255,255,255,0.2)' 
              : '0 8px 32px hsl(var(--primary) / 0.4), inset 0 2px 20px rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Guitar 
            size={28} 
            className={`text-white drop-shadow-lg transition-transform duration-300 ${
              isRecording ? 'rotate-12' : 'hover:rotate-6'
            }`} 
          />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center">
        {isRecording ? (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-destructive">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground">
              Recording...
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Tap to record (max 30s)
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularTimer;