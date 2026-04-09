import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Check, Music, Guitar, Piano, Mic, Drum, Wind, Zap, Waves } from 'lucide-react';

export interface AnalysisSelection {
  analysisTypes: string[];
  instrumentChoice: 'auto' | 'manual';
  selectedInstruments: string[];
  recordingType: 'solo' | 'multiple' | 'unknown';
  additionalOptions: 'auto' | 'manual';
  chordVocabulary: 'major-minor' | 'full';
}

interface AudioAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: AnalysisSelection) => void;
  audioSource: 'file' | 'microphone' | 'youtube';
}

const INSTRUMENTS = [
  { id: 'vocals', name: 'Vocals', icon: Mic },
  { id: 'piano', name: 'Piano', icon: Piano },
  { id: 'guitar', name: 'Guitar', icon: Guitar },
  { id: 'bass', name: 'Bass', icon: Music },
  { id: 'strings', name: 'Strings', icon: Music },
  { id: 'wind', name: 'Wind', icon: Wind },
  { id: 'synthesizer', name: 'Synthesizer', icon: Zap },
  { id: 'drums', name: 'Drums', icon: Drum }
];

const ANALYSIS_TYPES = [
  { id: 'transcription', name: 'Transcription', description: 'Generate sheet music & tabs', icon: Music },
  { id: 'chord-recognition', name: 'Chord Recognition', description: 'Detect chord progressions', icon: Guitar },
  { id: 'beat-tracking', name: 'Beat Tracking', description: 'Analyze rhythm & timing', icon: Waves },
  { id: 'source-separation', name: 'Source Separation', description: 'Extract individual stems', icon: Zap }
];

export const AudioAnalysisModal: React.FC<AudioAnalysisModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  audioSource
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selection, setSelection] = useState<AnalysisSelection>({
    analysisTypes: ['transcription'],
    instrumentChoice: 'auto',
    selectedInstruments: [],
    recordingType: 'unknown',
    additionalOptions: 'auto',
    chordVocabulary: 'major-minor'
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onConfirm(selection);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnalysisTypeToggle = (typeId: string) => {
    setSelection(prev => {
      const newTypes = prev.analysisTypes.includes(typeId)
        ? prev.analysisTypes.filter(t => t !== typeId)
        : [...prev.analysisTypes, typeId];
      return { ...prev, analysisTypes: newTypes };
    });
  };

  const handleInstrumentToggle = (instrumentId: string) => {
    setSelection(prev => {
      const newInstruments = prev.selectedInstruments.includes(instrumentId)
        ? prev.selectedInstruments.filter(i => i !== instrumentId)
        : [...prev.selectedInstruments, instrumentId];
      return { ...prev, selectedInstruments: newInstruments };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selection.analysisTypes.length > 0;
      case 2:
        return selection.instrumentChoice === 'auto' || selection.selectedInstruments.length > 0;
      case 3:
        return true; // Recording type is optional
      case 4:
        return true; // Additional options are optional
      default:
        return false;
    }
  };

  const getSourceTitle = () => {
    switch (audioSource) {
      case 'file': return 'File Upload';
      case 'microphone': return 'Live Recording';
      case 'youtube': return 'YouTube';
      default: return 'Audio';
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">SELECT ANALYSIS TYPE</h3>
        <p className="text-muted-foreground">Choose which analysis you want to perform</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ANALYSIS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selection.analysisTypes.includes(type.id);
          
          return (
            <div
              key={type.id}
              onClick={() => handleAnalysisTypeToggle(type.id)}
              className={`punk-card cursor-pointer p-6 transition-all duration-300 ${
                isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{type.name}</h4>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary mt-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">SELECT INSTRUMENTS</h3>
        <p className="text-muted-foreground">Choose your instruments or let AI detect them</p>
      </div>

      <RadioGroup
        value={selection.instrumentChoice}
        onValueChange={(value: 'auto' | 'manual') => 
          setSelection(prev => ({ ...prev, instrumentChoice: value }))
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <RadioGroupItem value="auto" id="auto-detect" />
            <Label htmlFor="auto-detect" className="text-lg font-medium cursor-pointer">
              Riot-Sheets should detect the instruments
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <RadioGroupItem value="manual" id="manual-select" />
            <Label htmlFor="manual-select" className="text-lg font-medium cursor-pointer">
              Select your instruments
            </Label>
          </div>
        </div>
      </RadioGroup>

      {selection.instrumentChoice === 'manual' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {INSTRUMENTS.map((instrument) => {
            const Icon = instrument.icon;
            const isSelected = selection.selectedInstruments.includes(instrument.id);
            
            return (
              <div
                key={instrument.id}
                onClick={() => handleInstrumentToggle(instrument.id)}
                className={`punk-instrument cursor-pointer p-4 ${
                  isSelected ? 'selected' : ''
                }`}
              >
                <Icon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">{instrument.name}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">RECORDING TYPE</h3>
        <p className="text-muted-foreground">What type of recording is this?</p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'solo', label: 'Solo Recording', description: 'Single instrument or voice' },
          { id: 'multiple', label: 'Multiple Instruments', description: 'Band or ensemble recording' },
          { id: 'unknown', label: "I don't know", description: 'Let the AI figure it out' }
        ].map((option) => (
          <div
            key={option.id}
            onClick={() => setSelection(prev => ({ ...prev, recordingType: option.id as any }))}
            className={`punk-card cursor-pointer p-6 transition-all duration-300 ${
              selection.recordingType === option.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg mb-1">{option.label}</h4>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              {selection.recordingType === option.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">ADDITIONAL OPTIONS</h3>
        <p className="text-muted-foreground">Fine-tune your analysis settings</p>
      </div>

      <RadioGroup
        value={selection.additionalOptions}
        onValueChange={(value: 'auto' | 'manual') => 
          setSelection(prev => ({ ...prev, additionalOptions: value }))
        }
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <RadioGroupItem value="auto" id="auto-options" />
            <Label htmlFor="auto-options" className="text-lg font-medium cursor-pointer">
              No, Riot-Sheets should automatically detect additional options for me
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <RadioGroupItem value="manual" id="manual-options" />
            <Label htmlFor="manual-options" className="text-lg font-medium cursor-pointer">
              I wish to add more options to achieve more definite results
            </Label>
          </div>
        </div>
      </RadioGroup>

      {selection.additionalOptions === 'manual' && selection.analysisTypes.includes('chord-recognition') && (
        <div className="mt-6 p-4 border rounded-lg">
          <h4 className="font-bold mb-4">Chord Recognition Vocabulary</h4>
          <RadioGroup
            value={selection.chordVocabulary}
            onValueChange={(value: 'major-minor' | 'full') => 
              setSelection(prev => ({ ...prev, chordVocabulary: value }))
            }
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="major-minor" id="simple-chords" />
                <Label htmlFor="simple-chords" className="cursor-pointer">
                  <span className="font-medium">Simple (Major/Minor)</span>
                  <span className="block text-sm text-muted-foreground">Better accuracy, basic chords only</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="full" id="advanced-chords" />
                <Label htmlFor="advanced-chords" className="cursor-pointer">
                  <span className="font-medium">Advanced (Full Vocabulary)</span>
                  <span className="block text-sm text-muted-foreground">Includes dim, aug, sus, 7ths, etc.</span>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-3xl font-bold">
            ANALYZE {getSourceTitle().toUpperCase()}
          </DialogTitle>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>BACK</span>
          </Button>

          <div className="flex items-center space-x-2">
            {selection.analysisTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {ANALYSIS_TYPES.find(t => t.id === type)?.name}
              </Badge>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="punk-button flex items-center space-x-2"
          >
            <span>{currentStep === totalSteps ? 'START ANALYSIS' : 'NEXT'}</span>
            {currentStep < totalSteps && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};