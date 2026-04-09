import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ChordSegment {
  start: number;
  end: number;
  chord: string;
  duration: number;
}

interface InteractiveAudioPlayerProps {
  audioBlob: Blob | null;
  chordTimeline: ChordSegment[];
  onChordChange?: (chord: string, timestamp: number) => void;
  onTimeUpdate?: (time: number) => void;
}

const InteractiveAudioPlayer: React.FC<InteractiveAudioPlayerProps> = ({
  audioBlob,
  chordTimeline,
  onChordChange,
  onTimeUpdate
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentChord, setCurrentChord] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  // Create audio URL from blob
  useEffect(() => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  // Update current time and detect chord changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Find current chord based on timeline
      const currentSegment = chordTimeline.find(
        segment => time >= segment.start && time < segment.end
      );

      if (currentSegment && currentSegment.chord !== currentChord) {
        setCurrentChord(currentSegment.chord);
        onChordChange?.(currentSegment.chord, time);
      }
    };

    const setAudioDuration = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', setAudioDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', setAudioDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [chordTimeline, currentChord, onChordChange, onTimeUpdate]);

  // Handle play/pause
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Seek to specific time
  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.max(0, Math.min(time, duration));
  };

  // Handle speed change
  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  // Skip to next/previous chord
  const skipToChord = (direction: 'next' | 'prev') => {
    const currentIndex = chordTimeline.findIndex(
      segment => currentTime >= segment.start && currentTime < segment.end
    );

    let targetIndex;
    if (direction === 'next') {
      targetIndex = Math.min(currentIndex + 1, chordTimeline.length - 1);
    } else {
      targetIndex = Math.max(currentIndex - 1, 0);
    }

    if (targetIndex >= 0 && targetIndex < chordTimeline.length) {
      seekTo(chordTimeline[targetIndex].start);
    }
  };

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5];

  return (
    <div className="punk-card space-y-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Current Chord Display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">
          {currentChord || 'No Chord'}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={([value]) => seekTo(value)}
          className="w-full"
        />
        
        {/* Chord Markers */}
        <div className="relative h-2">
          {chordTimeline.map((segment, index) => (
            <div
              key={index}
              className="absolute h-full bg-primary/30 border-l-2 border-primary cursor-pointer hover:bg-primary/50 transition-colors"
              style={{
                left: `${(segment.start / duration) * 100}%`,
                width: `${(segment.duration / duration) * 100}%`
              }}
              onClick={() => seekTo(segment.start)}
              title={`${segment.chord} at ${formatTime(segment.start)}`}
            />
          ))}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => skipToChord('prev')}
          disabled={!chordTimeline.length}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          onClick={togglePlayback}
          size="lg"
          className="w-16 h-16 rounded-full"
          disabled={!audioUrl}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => skipToChord('next')}
          disabled={!chordTimeline.length}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center justify-center space-x-2">
        <span className="text-sm text-muted-foreground">Speed:</span>
        {speedOptions.map((speed) => (
          <Button
            key={speed}
            variant={playbackSpeed === speed ? "default" : "outline"}
            size="sm"
            onClick={() => handleSpeedChange(speed)}
          >
            {speed}x
          </Button>
        ))}
      </div>
    </div>
  );
};

export default InteractiveAudioPlayer;