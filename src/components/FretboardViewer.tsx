import React, { useEffect, useRef, useState } from 'react';
import { Fretboard } from '@moonwave99/fretboard.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface FretboardViewerProps {
  chords?: string[];
  currentChord?: string;
  chordTimeline?: Array<[number, number, string]>;
  currentTime?: number;
  onChordClick?: (chord: string) => void;
  instrument?: 'guitar' | 'bass';
  size?: 'sm' | 'md' | 'lg';
}

const GUITAR_TUNINGS = {
  standard: ["E2", "A2", "D3", "G3", "B3", "E4"],
  dropD: ["D2", "A2", "D3", "G3", "B3", "E4"],
  halfStepDown: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"],
  openG: ["D2", "G2", "D3", "G3", "B3", "D4"],
  DADGAD: ["D2", "A2", "D3", "G3", "A3", "D4"]
};

const BASS_TUNINGS = {
  standard: ["E1", "A1", "D2", "G2"],
  dropD: ["D1", "A1", "D2", "G2"],
  fiveString: ["B0", "E1", "A1", "D2", "G2"]
};

const CHORD_PATTERNS: { [key: string]: string } = {
  // Major chords
  'C': 'x32010',
  'D': 'xx0232',
  'E': '022100',
  'F': '133211',
  'G': '320003',
  'A': 'x02220',
  'B': 'x24442',
  
  // Minor chords
  'Am': 'x02210',
  'Bm': 'x24432',
  'Cm': 'x35543',
  'Dm': 'xx0231',
  'Em': '022000',
  'Fm': '133111',
  'Gm': '355333',
  
  // Power chords (punk staples)
  'C5': 'x355xx',
  'D5': 'x577xx',
  'E5': '022xxx',
  'F5': '133xxx',
  'G5': '355xxx',
  'A5': '577xxx',
  'B5': '799xxx',
  
  // Common punk chords
  'Bb': 'x13331',
  'Bb5': 'x133xx',
};

const FretboardViewer: React.FC<FretboardViewerProps> = ({
  chords = [],
  currentChord = '',
  chordTimeline = [],
  currentTime = 0,
  onChordClick,
  instrument = 'guitar',
  size = 'md'
}) => {
  const fretboardRef = useRef<HTMLDivElement>(null);
  const fretboardInstance = useRef<Fretboard | null>(null);
  const [selectedTuning, setSelectedTuning] = useState('standard');
  const [fretCount, setFretCount] = useState([12]);
  const [showChordProgression, setShowChordProgression] = useState(true);

  const tunings = instrument === 'guitar' ? GUITAR_TUNINGS : BASS_TUNINGS;
  const stringCount = instrument === 'guitar' ? 6 : 4;

  const sizeConfig = {
    sm: { width: 600, height: 120, dotSize: 15 },
    md: { width: 800, height: 150, dotSize: 20 },
    lg: { width: 1000, height: 180, dotSize: 25 }
  };

  useEffect(() => {
    if (!fretboardRef.current) return;

    // Clear existing fretboard
    if (fretboardInstance.current) {
      fretboardRef.current.innerHTML = '';
    }

    const config = sizeConfig[size];
    
    fretboardInstance.current = new Fretboard({
      el: fretboardRef.current,
      tuning: tunings[selectedTuning as keyof typeof tunings],
      stringCount,
      fretCount: fretCount[0],
      width: config.width,
      height: config.height,
      dotSize: config.dotSize,
      dotFill: 'hsl(var(--primary))',
      dotStrokeColor: 'hsl(var(--primary-foreground))',
      fretColor: 'hsl(var(--muted-foreground))',
      stringColor: 'hsl(var(--muted-foreground))',
      nutColor: 'hsl(var(--foreground))',
      middleFretColor: 'hsl(var(--accent))',
      crop: true,
      showFretNumbers: true,
      fretNumbersColor: 'hsl(var(--muted-foreground))',
    });

    // Add click event listener
    fretboardInstance.current.on('click', (position, event) => {
      console.log('Fretboard clicked:', position);
    });

    renderCurrentChord();

    return () => {
      if (fretboardInstance.current) {
        fretboardInstance.current.removeEventListeners();
      }
    };
  }, [selectedTuning, fretCount, size, stringCount]);

  useEffect(() => {
    renderCurrentChord();
  }, [currentChord, currentTime, chordTimeline]);

  const renderCurrentChord = () => {
    if (!fretboardInstance.current) return;

    let chordToDisplay = currentChord;

    // If we have a timeline and current time, find the active chord
    if (chordTimeline.length > 0 && currentTime !== undefined) {
      const activeChord = chordTimeline.find(([start, end]) => 
        currentTime >= start && currentTime < end
      );
      if (activeChord) {
        chordToDisplay = activeChord[2];
      }
    }

    if (!chordToDisplay || chordToDisplay === 'No Chord') {
      fretboardInstance.current.clear().render();
      return;
    }

    // Get chord pattern
    const pattern = CHORD_PATTERNS[chordToDisplay];
    if (pattern) {
      try {
        // Check if pattern needs barre
        const needsBarre = ['F', 'Fm', 'B', 'Bm', 'Bb', 'Cm', 'Gm'].includes(chordToDisplay);
        const barres = needsBarre ? [{ fret: 1 }] : undefined;
        
        fretboardInstance.current
          .clear()
          .renderChord(pattern, barres)
          .style({
            text: () => '',
            fill: 'hsl(var(--primary))',
            stroke: 'hsl(var(--primary-foreground))',
          });
      } catch (error) {
        console.warn('Error rendering chord:', chordToDisplay, error);
        fretboardInstance.current.clear().render();
      }
    } else {
      // For unknown chords, show chord name
      fretboardInstance.current.clear().render();
    }
  };

  const handleChordClick = (chord: string) => {
    if (onChordClick) {
      onChordClick(chord);
    }
  };

  return (
    <Card className="punk-card p-4">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Tuning:</label>
            <Select value={selectedTuning} onValueChange={setSelectedTuning}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(tunings).map((tuning) => (
                  <SelectItem key={tuning} value={tuning}>
                    {tuning.charAt(0).toUpperCase() + tuning.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Frets:</label>
            <div className="w-24">
              <Slider
                value={fretCount}
                onValueChange={setFretCount}
                min={5}
                max={24}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-center text-muted-foreground">
                {fretCount[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Current Chord Display */}
        {currentChord && (
          <div className="text-center">
            <h3 className="text-lg font-bold text-primary mb-2">
              {currentChord}
            </h3>
          </div>
        )}

        {/* Fretboard */}
        <div className="flex justify-center bg-background/50 rounded-lg p-4">
          <div ref={fretboardRef} className="fretboard-container" />
        </div>

        {/* Chord Progression */}
        {showChordProgression && chords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Chord Progression:</h4>
            <div className="flex flex-wrap gap-2">
              {chords.map((chord, index) => (
                <Button
                  key={index}
                  variant={chord === currentChord ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleChordClick(chord)}
                  className="min-w-12"
                >
                  {chord}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline visualization */}
        {chordTimeline.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Timeline:</h4>
            <div className="relative bg-muted rounded h-8 overflow-hidden">
              {chordTimeline.map(([start, end, chord], index) => {
                const totalDuration = Math.max(...chordTimeline.map(([s, e]) => e));
                const leftPercent = (start / totalDuration) * 100;
                const widthPercent = ((end - start) / totalDuration) * 100;
                const isActive = currentTime >= start && currentTime < end;
                
                return (
                  <div
                    key={index}
                    className={`absolute top-0 bottom-0 flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    onClick={() => handleChordClick(chord)}
                  >
                    {chord}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FretboardViewer;