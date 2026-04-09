import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Volume2, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChordDiagram from '../ChordDiagram';

interface ChordSegment {
  start: number;
  end: number;
  chord: string;
  duration: number;
}

interface PracticeModeProps {
  audioBlob: Blob;
  chordTimeline: ChordSegment[];
  songInfo: {
    title: string;
    artist: string;
    key?: string;
    tempo?: number;
  };
}

const PracticeMode: React.FC<PracticeModeProps> = ({ 
  audioBlob, 
  chordTimeline, 
  songInfo 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const metronomeRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentChord, setCurrentChord] = useState('');
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [tempo, setTempo] = useState(songInfo.tempo || 120);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [practiceStats, setPracticeStats] = useState({
    sessionTime: 0,
    chordsPlayed: 0,
    loops: 0
  });
  const { toast } = useToast();

  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  // Initialize metronome
  useEffect(() => {
    metronomeRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.close();
      }
    };
  }, []);

  // Track practice session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPracticeStats(prev => ({
          ...prev,
          sessionTime: prev.sessionTime + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Audio playback and chord tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Find current chord
      const currentSegment = chordTimeline.find(
        segment => time >= segment.start && time < segment.end
      );

      if (currentSegment && currentSegment.chord !== currentChord) {
        setCurrentChord(currentSegment.chord);
        setPracticeStats(prev => ({
          ...prev,
          chordsPlayed: prev.chordsPlayed + 1
        }));
      }

      // Handle looping
      if (isLooping && loopEnd > loopStart && time >= loopEnd) {
        audio.currentTime = loopStart;
        setPracticeStats(prev => ({
          ...prev,
          loops: prev.loops + 1
        }));
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [chordTimeline, currentChord, isLooping, loopStart, loopEnd]);

  // Metronome functionality
  const playMetronomeClick = () => {
    if (!metronomeRef.current) return;
    
    const oscillator = metronomeRef.current.createOscillator();
    const gainNode = metronomeRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(metronomeRef.current.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(metronomeRef.current.currentTime + 0.1);
  };

  useEffect(() => {
    let metronomeInterval: NodeJS.Timeout;
    
    if (metronomeEnabled && isPlaying) {
      const interval = (60 / tempo) * 1000;
      metronomeInterval = setInterval(playMetronomeClick, interval);
    }
    
    return () => clearInterval(metronomeInterval);
  }, [metronomeEnabled, isPlaying, tempo]);

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

  const setLoopSection = (chordIndex: number) => {
    const chord = chordTimeline[chordIndex];
    if (!chord) return;

    setLoopStart(chord.start);
    setLoopEnd(chord.end);
    setIsLooping(true);
    setSelectedSection(chordIndex);
    
    toast({
      title: 'Loop Set',
      description: `Looping ${chord.chord} chord section`,
    });
  };

  const clearLoop = () => {
    setIsLooping(false);
    setSelectedSection(null);
    setLoopStart(0);
    setLoopEnd(0);
    
    toast({
      title: 'Loop Cleared',
      description: 'Practicing full song',
    });
  };

  const resetPracticeStats = () => {
    setPracticeStats({
      sessionTime: 0,
      chordsPlayed: 0,
      loops: 0
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="punk-card space-y-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">🎸 PRACTICE MODE</h3>
        <p className="text-sm text-muted-foreground">
          Master {songInfo.title} with interactive practice tools
        </p>
      </div>

      {/* Current Chord & Diagram */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="text-center space-y-4">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">
              {currentChord || 'Ready to Practice'}
            </div>
            <div className="text-sm text-muted-foreground">
              Current Chord
            </div>
          </div>
          
          {/* Practice Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="punk-card p-3">
              <div className="text-lg font-bold">{formatTime(practiceStats.sessionTime)}</div>
              <div className="text-xs text-muted-foreground">Session</div>
            </div>
            <div className="punk-card p-3">
              <div className="text-lg font-bold">{practiceStats.chordsPlayed}</div>
              <div className="text-xs text-muted-foreground">Chords</div>
            </div>
            <div className="punk-card p-3">
              <div className="text-lg font-bold">{practiceStats.loops}</div>
              <div className="text-xs text-muted-foreground">Loops</div>
            </div>
          </div>
        </div>

        {/* Chord Diagram */}
        <div className="flex justify-center items-center">
          <ChordDiagram chord={currentChord} size="lg" />
        </div>
      </div>

      {/* Practice Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Playback Controls */}
        <div className="space-y-4">
          <h4 className="font-bold">Playback Controls</h4>
          
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={togglePlayback}
              size="lg"
              className="w-16 h-16 rounded-full"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            
            <Button onClick={clearLoop} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Loop
            </Button>
          </div>

          {/* Loop Status */}
          {isLooping && (
            <div className="text-center">
              <Badge variant="secondary">
                Looping: {formatTime(loopStart)} - {formatTime(loopEnd)}
              </Badge>
            </div>
          )}
        </div>

        {/* Practice Settings */}
        <div className="space-y-4">
          <h4 className="font-bold">Practice Settings</h4>
          
          {/* Metronome */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Metronome</span>
            </div>
            <Button
              onClick={() => setMetronomeEnabled(!metronomeEnabled)}
              variant={metronomeEnabled ? "default" : "outline"}
              size="sm"
            >
              {metronomeEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>

          {/* Tempo Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tempo: {tempo} BPM</span>
              <Button onClick={resetPracticeStats} variant="outline" size="sm">
                Reset Stats
              </Button>
            </div>
            <Slider
              value={[tempo]}
              onValueChange={([value]) => setTempo(value)}
              min={60}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Chord Timeline - Practice Sections */}
      <div className="space-y-4">
        <h4 className="font-bold">Practice Sections</h4>
        
        <div className="grid gap-2 max-h-48 overflow-y-auto">
          {chordTimeline.map((segment, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-3 rounded border-l-4 cursor-pointer transition-colors ${
                selectedSection === index
                  ? 'bg-primary/20 border-primary'
                  : 'bg-muted/50 border-muted hover:bg-muted'
              }`}
              onClick={() => setLoopSection(index)}
            >
              <div className="flex items-center space-x-4">
                <span className="font-mono text-sm text-muted-foreground">
                  {segment.start.toFixed(1)}s
                </span>
                <span className="font-bold">
                  {segment.chord}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {segment.duration.toFixed(1)}s
                </span>
                {selectedSection === index && (
                  <Badge variant="secondary">LOOPING</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Click any chord section to practice it on loop 🔄
      </div>
    </div>
  );
};

export default PracticeMode;