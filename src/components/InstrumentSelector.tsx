import React from 'react';

interface SelectedInstrument {
  id: string;
  name: string;
  emoji: string;
  isBeta?: boolean;
}

interface InstrumentSelectorProps {
  selectedInstrument: string;
  onSelectInstrument: (instrumentId: string) => void;
}

const INSTRUMENTS: SelectedInstrument[] = [
  { id: 'piano', name: 'Piano', emoji: '🎹' },
  { id: 'guitar', name: 'Guitar', emoji: '🎸' },
  { id: 'bass', name: 'Bass', emoji: '🎸' },
  { id: 'drums', name: 'Drums', emoji: '🥁' },
  { id: 'violin', name: 'Violin', emoji: '🎻' },
  { id: 'vocals', name: 'Vocals', emoji: '🎤' },
  { id: 'saxophone', name: 'Saxophone', emoji: '🎷' },
  { id: 'fullband', name: 'Full Band', emoji: '🎶' },
  { id: 'popsong', name: 'Pop Song', emoji: '🎵' },
  { id: 'other', name: 'Other', emoji: '🎼' }
];

const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ 
  selectedInstrument, 
  onSelectInstrument 
}) => {
  return (
    <section className="space-y-8">
      <h2 className="punk-section-title text-center">🥁 PICK YOUR WEAPON</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {INSTRUMENTS.map((instrument) => (
          <div
            key={instrument.id}
            className={`punk-instrument ${
              selectedInstrument === instrument.id ? 'selected' : ''
            }`}
            onClick={() => onSelectInstrument(instrument.id)}
          >
            <div className="text-3xl mb-2">{instrument.emoji}</div>
            <div className="font-bold text-sm">{instrument.name}</div>
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-muted-foreground">
          Selected: <span className="text-primary font-bold">
            {INSTRUMENTS.find(i => i.id === selectedInstrument)?.name}
          </span>
        </p>
      </div>
    </section>
  );
};

export default InstrumentSelector;
export { INSTRUMENTS };