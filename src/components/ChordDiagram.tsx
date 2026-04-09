import React from 'react';

interface ChordDiagramProps {
  chord: string;
  instrument?: 'guitar' | 'piano';
  size?: 'sm' | 'md' | 'lg';
  useFretboard?: boolean;
  onChordClick?: (chord: string) => void;
}

const ChordDiagram: React.FC<ChordDiagramProps> = ({ 
  chord, 
  instrument = 'guitar',
  size = 'md',
  useFretboard = false,
  onChordClick
}) => {
  if (!chord || chord === 'No Chord' || chord === 'Unknown') {
    return (
      <div className="punk-card text-center py-8">
        <div className="text-muted-foreground">No chord to display</div>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-32 h-40',
    lg: 'w-40 h-48'
  };

  if (instrument === 'guitar') {
    return <GuitarChordDiagram chord={chord} size={size} className={sizeClasses[size]} />;
  } else {
    return <PianoChordDiagram chord={chord} size={size} className={sizeClasses[size]} />;
  }
};

interface DiagramProps {
  chord: string;
  size: string;
  className: string;
}

const GuitarChordDiagram: React.FC<DiagramProps> = ({ chord, className }) => {
  // Punk-focused guitar chord patterns (power chords and common punk chords)
  const chordPatterns: { [key: string]: { frets: (number | 'x')[], barres?: number[], name: string } } = {
    'C': { frets: ['x', 3, 2, 0, 1, 0], name: 'C Major' },
    'C5': { frets: ['x', 3, 5, 5, 'x', 'x'], name: 'C Power' },
    'G': { frets: [3, 2, 0, 0, 3, 3], name: 'G Major' },
    'G5': { frets: [3, 5, 5, 'x', 'x', 'x'], name: 'G Power' },
    'Am': { frets: ['x', 0, 2, 2, 1, 0], name: 'A Minor' },
    'A5': { frets: ['x', 0, 2, 2, 'x', 'x'], name: 'A Power' },
    'F': { frets: [1, 3, 3, 2, 1, 1], barres: [1], name: 'F Major' },
    'F5': { frets: [1, 3, 3, 'x', 'x', 'x'], name: 'F Power' },
    'D': { frets: ['x', 'x', 0, 2, 3, 2], name: 'D Major' },
    'D5': { frets: ['x', 'x', 0, 2, 3, 'x'], name: 'D Power' },
    'E': { frets: [0, 2, 2, 1, 0, 0], name: 'E Major' },
    'E5': { frets: [0, 2, 2, 'x', 'x', 'x'], name: 'E Power' },
    'Em': { frets: [0, 2, 2, 0, 0, 0], name: 'E Minor' },
    'Dm': { frets: ['x', 'x', 0, 2, 3, 1], name: 'D Minor' },
    'Bb': { frets: ['x', 1, 3, 3, 3, 1], barres: [1], name: 'Bb Major' },
    'Bb5': { frets: ['x', 1, 3, 3, 'x', 'x'], name: 'Bb Power' },
  };

  // Try to match chord with pattern (handle variations like C#, Cm, etc.)
  let pattern = chordPatterns[chord];
  if (!pattern) {
    // Try power chord version
    const powerChord = chord.replace(/m|maj|dim|aug|\d+/, '') + '5';
    pattern = chordPatterns[powerChord];
  }
  if (!pattern) {
    // Try base chord
    const baseChord = chord.replace(/[#b]?[m|maj|dim|aug|\d+].*/, '').charAt(0).toUpperCase();
    pattern = chordPatterns[baseChord] || chordPatterns[baseChord + '5'];
  }

  if (!pattern) {
    return (
      <div className={`punk-card ${className} flex flex-col items-center justify-center`}>
        <div className="font-bold text-primary mb-2">{chord}</div>
        <div className="text-xs text-muted-foreground text-center">
          Power chord<br />fingering needed
        </div>
      </div>
    );
  }

  return (
    <div className={`punk-card ${className} flex flex-col items-center justify-center p-2`}>
      <div className="font-bold text-primary mb-2 text-sm">{chord}</div>
      
      {/* Guitar Fretboard */}
      <div className="relative">
        {/* Frets */}
        <div className="grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map(fret => (
            <div key={fret} className="w-6 h-8 border border-muted-foreground/40 relative">
              {/* Fret markers */}
              {pattern.frets.map((fretNum, stringIndex) => (
                fretNum === fret ? (
                  <div
                    key={stringIndex}
                    className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background"
                    style={{
                      left: '50%',
                      top: `${(stringIndex + 0.5) * (100 / 6)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ) : null
              ))}
            </div>
          ))}
        </div>
        
        {/* String indicators */}
        <div className="absolute -left-4 top-0 h-full flex flex-col justify-around text-xs">
          {pattern.frets.map((fret, index) => (
            <div key={index} className="text-muted-foreground">
              {fret === 'x' ? '×' : fret === 0 ? '○' : ''}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">{pattern.name}</div>
    </div>
  );
};

const PianoChordDiagram: React.FC<DiagramProps> = ({ chord, className }) => {
  const chordPatterns: { [key: string]: { keys: string[], name: string } } = {
    'C': { keys: ['C', 'E', 'G'], name: 'C Major' },
    'G': { keys: ['G', 'B', 'D'], name: 'G Major' },
    'Am': { keys: ['A', 'C', 'E'], name: 'A Minor' },
    'F': { keys: ['F', 'A', 'C'], name: 'F Major' },
    'D': { keys: ['D', 'F#', 'A'], name: 'D Major' },
    'E': { keys: ['E', 'G#', 'B'], name: 'E Major' },
    'Em': { keys: ['E', 'G', 'B'], name: 'E Minor' },
    'Dm': { keys: ['D', 'F', 'A'], name: 'D Minor' },
  };

  const pattern = chordPatterns[chord] || { keys: [chord], name: chord };

  return (
    <div className={`punk-card ${className} flex flex-col items-center justify-center p-2`}>
      <div className="font-bold text-primary mb-2 text-sm">{chord}</div>
      
      {/* Piano Keys */}
      <div className="relative">
        <div className="flex">
          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map(note => (
            <div
              key={note}
              className={`w-6 h-12 border border-muted-foreground ${
                pattern.keys.includes(note) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background'
              }`}
            >
              <div className="text-xs text-center mt-8">{note}</div>
            </div>
          ))}
        </div>
        
        {/* Black keys */}
        <div className="absolute top-0 flex">
          {[{note: 'C#', left: '1.25rem'}, {note: 'D#', left: '2.75rem'}, {note: 'F#', left: '5.25rem'}, {note: 'G#', left: '6.75rem'}, {note: 'A#', left: '8.25rem'}].map(({ note, left }) => (
            <div
              key={note}
              className={`absolute w-4 h-8 border border-muted-foreground ${
                pattern.keys.includes(note) 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground'
              }`}
              style={{ left }}
            />
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">{pattern.name}</div>
    </div>
  );
};

export default ChordDiagram;