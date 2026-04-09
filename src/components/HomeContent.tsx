import React from 'react';
import { useNavigate } from 'react-router-dom';
import InstrumentSelector from '@/components/InstrumentSelector';
import ResultsSection from '@/components/ResultsSection';
import SignUpPricingSection from '@/components/SignUpPricingSection';
import { MusicAnalysisHistory } from '@/components/MusicAnalysisHistory';
import { useAuth } from '@/contexts/AuthContext';

interface HomeContentProps {
  selectedInstrument: string;
  setSelectedInstrument: (instrument: string) => void;
  isProcessing: boolean;
  results: any;
  error: string;
  originalAudio: Blob | null;
}

const HomeContent: React.FC<HomeContentProps> = ({
  selectedInstrument,
  setSelectedInstrument,
  isProcessing,
  results,
  error,
  originalAudio
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      
      {/* Record Again Section */}
      <section className="text-center">
        <button
          onClick={() => navigate('/')}
          className="punk-button text-2xl px-8 py-4"
        >
          🎤 RECORD AGAIN
        </button>
      </section>

      {/* Sign Up and Pricing Section */}
      <SignUpPricingSection />

      {/* Instrument Selection */}
      <InstrumentSelector 
        selectedInstrument={selectedInstrument}
        onSelectInstrument={setSelectedInstrument}
      />

      {/* Error Display */}
      {error && (
        <div className="punk-card border-destructive bg-destructive/10 text-center">
          <p className="text-destructive font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="punk-card text-center slide-in">
          <div className="space-y-4">
            <div className="loading-spinner w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
            <h3 className="text-xl font-bold">ANALYZING YOUR AUDIO...</h3>
            <p className="text-muted-foreground">
              Our AI is transcribing your punk masterpiece
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      <ResultsSection results={results} originalAudio={originalAudio} />
      
      {/* Music Analysis History - Only for authenticated users */}
      {user && (
        <section className="space-y-6">
          <div className="punk-card">
            <MusicAnalysisHistory />
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeContent;