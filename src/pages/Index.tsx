import React, { useState } from 'react';
import { functions } from '@/lib/api';
import HeroSection from '@/components/HeroSection';
import FileUploadSection from '@/components/FileUploadSection';
import MicrophoneSection from '@/components/MicrophoneSection';
import YouTubeSection from '@/components/YouTubeSection';
import InstrumentSelector, { INSTRUMENTS } from '@/components/InstrumentSelector';
import ResultsSection from '@/components/ResultsSection';
import SignUpPricingSection from '@/components/SignUpPricingSection';
import FooterNavigation from '@/components/FooterNavigation';

const Index = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('piano');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [originalAudio, setOriginalAudio] = useState<Blob | null>(null);

  // YouTube Processing
  const handleYouTubeProcess = async (audioData: string, metadata: any) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('Processing YouTube audio with metadata:', metadata);

      // Get selected instrument name
      const instrumentName = INSTRUMENTS.find(i => i.id === selectedInstrument)?.name || 'Unknown';

      // Call the Supabase Edge Function with YouTube audio data
      const { data, error } = await functions.invoke('identify-song', {
        body: {
          audioData: audioData,
          instrument: instrumentName
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process audio');
      }

      if (data.status === 'error') {
        if (data.error === 'Song not recognized') {
          setError('Song not recognized. Try a different YouTube video or use a clearer audio sample.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      // Enhance results with YouTube metadata
      const enhancedResults = {
        ...data,
        song: {
          ...data.song,
          title: metadata.title || data.song.title,
          artist: metadata.channelTitle || data.song.artist,
          source: 'YouTube',
          videoId: metadata.videoId,
          thumbnailUrl: metadata.thumbnailUrl
        }
      };

      setResults(enhancedResults);
      
      // Create a blob from the base64 audio for playback
      const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      const audioBlob = new Blob([binaryData], { type: 'audio/mp3' });
      setOriginalAudio(audioBlob);

    } catch (error) {
      console.error('YouTube processing error:', error);
      setError('Failed to process YouTube video. Try again or use a different video.');
    } finally {
      setIsProcessing(false);
    }
  };
  const handleAudioProcessing = async (audioData: File | Blob) => {
    setIsProcessing(true);
    setError('');
    setOriginalAudio(audioData); // Store original audio for playback

    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioData.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Get selected instrument name
      const instrumentName = INSTRUMENTS.find(i => i.id === selectedInstrument)?.name || 'Unknown';

      // Call the Supabase Edge Function
      const { data, error } = await functions.invoke('identify-song', {
        body: {
          audioData: base64Audio,
          instrument: instrumentName
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process audio');
      }

      if (data.status === 'error') {
        if (data.error === 'Song not recognized') {
          setError('Song not recognized. Try recording again or use a clearer audio sample.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setResults(data);
    } catch (error) {
      console.error('Processing error:', error);
      setError('Failed to process audio. Try again or use a different file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      <div className="container mx-auto px-4 py-12 space-y-16">
        
        {/* Audio Input Section */}
        <section className="space-y-8">
          <h2 className="punk-section-title text-center">🎸 FEED THE MACHINE</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FileUploadSection 
              onFileUpload={handleAudioProcessing} 
              isProcessing={isProcessing} 
            />
            <MicrophoneSection 
              onSubmitRecording={handleAudioProcessing} 
              isProcessing={isProcessing} 
            />
            <YouTubeSection 
              isProcessing={isProcessing}
              onYouTubeProcess={handleYouTubeProcess}
            />
          </div>
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
      </div>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  );
};

export default Index;