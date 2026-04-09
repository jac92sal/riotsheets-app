
import React, { useEffect, useState } from 'react';
import CircularTimer from '@/components/CircularTimer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioAnalysisModal } from '@/components/AudioAnalysisModal';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import { useAuth } from '@/contexts/AuthContext';
import FretboardViewer from '@/components/FretboardViewer';
import { Badge } from '@/components/ui/badge';
import punkHeroBg from '@/assets/punk-hero-bg.jpg';

const Recording = () => {
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  const { user } = useAuth();
  const {
    recorder,
    isPlayingRecording,
    error,
    startRecording,
    stopRecording,
    playRecording,
    startNewRecording
  } = useAudioRecorder();

  const {
    isProcessing,
    results,
    error: processingError,
    showAnalysisModal,
    setShowAnalysisModal,
    audioSource,
    handleAudioReady,
    handleAnalysisConfirm
  } = useAudioProcessing();

  // Check browser compatibility on mount
  useEffect(() => {
    const checkBrowserSupport = () => {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        setBrowserSupported(false);
        console.warn('Browser does not support audio recording');
      } else {
        console.log('Browser supports audio recording');
      }
    };
    checkBrowserSupport();
  }, []);

  const submitRecording = async () => {
    console.log('SUBMIT RECORDING clicked - starting guitar transcription');
    if (recorder.recordedAudio) {
      console.log('Audio data found, size:', recorder.recordedAudio.size, 'bytes');
      // Don't call startNewRecording here — wait until user explicitly records again
      await handleAudioReady(recorder.recordedAudio, 'microphone');
    } else {
      console.error('No recorded audio found!');
    }
  };

  // Extract results data for inline display
  const analysis = results?.analysis;
  const song = results?.song;
  const transcription = results?.transcription;
  const chords = analysis?.chords || [];
  const chordTimeline = transcription?.chord_timeline || [];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.7), rgba(26, 26, 26, 0.8)), url(${punkHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Processing State */}
        {isProcessing && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">ANALYZING...</h2>
              <p className="text-muted-foreground">
                Processing your recording
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {(error || processingError) && !isProcessing && !results && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-xl font-bold text-destructive">ERROR</h2>
            <p className="text-destructive text-sm">{error || processingError}</p>
            <button
              onClick={startNewRecording}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Inline Results Display (for anonymous users or when results are in state) */}
        {results && !isProcessing && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">{song?.title || 'Your Recording'}</h1>
              <p className="text-muted-foreground">{song?.artist || ''}</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {analysis?.key && <Badge variant="secondary">Key: {analysis.key}</Badge>}
                {analysis?.tempo && <Badge variant="secondary">{analysis.tempo} BPM</Badge>}
                {analysis?.difficulty && <Badge variant="outline">{analysis.difficulty}</Badge>}
                {analysis?.real_data && <Badge className="bg-green-600">AI Transcription</Badge>}
                {!analysis?.real_data && <Badge variant="outline">Basic Analysis</Badge>}
              </div>
            </div>

            {/* Fretboard with detected chords */}
            {chords.length > 0 && (
              <FretboardViewer
                chords={chords}
                currentChord={chords[0] || ''}
                chordTimeline={chordTimeline}
                currentTime={0}
                onChordClick={() => {}}
                instrument="guitar"
                size="md"
              />
            )}

            {/* Analysis tips */}
            {analysis?.tips && (
              <div className="bg-card border rounded-lg p-4 text-center text-sm text-muted-foreground">
                {analysis.tips}
              </div>
            )}

            {/* Download buttons if real transcription files available */}
            {transcription?.sheet_music_available && (
              <div className="grid grid-cols-3 gap-2">
                {transcription.downloads?.pdf && (
                  <a href={transcription.downloads.pdf} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-center text-sm font-medium hover:bg-secondary/90">
                    PDF Sheet Music
                  </a>
                )}
                {transcription.downloads?.midi && (
                  <a href={transcription.downloads.midi} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-center text-sm font-medium hover:bg-secondary/90">
                    MIDI File
                  </a>
                )}
                {transcription.downloads?.gp5 && (
                  <a href={transcription.downloads.gp5} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-center text-sm font-medium hover:bg-secondary/90">
                    Guitar Pro
                  </a>
                )}
              </div>
            )}

            {/* Record again button */}
            <div className="text-center">
              <button
                onClick={() => {
                  startNewRecording();
                  // Clear results by reloading — results state is in useAudioProcessing
                  window.location.reload();
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                RECORD AGAIN
              </button>
            </div>
          </div>
        )}

        {/* Main Recording Interface */}
        {!isProcessing && !results && !(error || processingError) && (
          <div className="text-center space-y-8 animate-fade-in">
            {!browserSupported ? (
              <div className="space-y-4">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-xl font-bold">Browser Not Supported</h2>
                <p className="text-muted-foreground">
                  Please use Chrome, Firefox, or Safari for recording.
                </p>
              </div>
            ) : !recorder.recordedAudio ? (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">RIOT SHEETS</h1>
                <p className="text-muted-foreground">
                  Tap to record your music
                </p>
                {!user && (
                  <p className="text-xs text-primary">
                    Free Mode: 3 transcriptions per day
                  </p>
                )}
                <CircularTimer
                  isRecording={recorder.isRecording}
                  timeLeft={recorder.timeLeft}
                  maxTime={30}
                  onStart={startRecording}
                  onStop={stopRecording}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  {recorder.isRecording ? 'Recording...' : 'Grant microphone permission when prompted'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-6xl">🎵</div>
                <h2 className="text-xl font-bold">Recording Complete!</h2>
                <div className="space-y-3">
                  <button
                    onClick={playRecording}
                    className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-bold hover:bg-secondary/90 transition-colors"
                    disabled={isPlayingRecording}
                  >
                    {isPlayingRecording ? 'PLAYING...' : 'PLAY RECORDING'}
                  </button>
                  <button
                    onClick={submitRecording}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
                    disabled={isProcessing}
                  >
                    TRANSCRIBE TO SHEET MUSIC
                  </button>
                  <button
                    onClick={startNewRecording}
                    className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-bold hover:bg-muted/80 transition-colors"
                  >
                    RECORD AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audio Analysis Selection Modal */}
      <AudioAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onConfirm={handleAnalysisConfirm}
        audioSource={audioSource}
      />
    </div>
  );
};

export default Recording;
