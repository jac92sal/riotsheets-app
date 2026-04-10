
import React, { useEffect, useState } from 'react';
import CircularTimer from '@/components/CircularTimer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioAnalysisModal } from '@/components/AudioAnalysisModal';
import { useAudioProcessing } from '@/hooks/useAudioProcessing';
import { useAuth } from '@/contexts/AuthContext';
import FretboardViewer from '@/components/FretboardViewer';
import Navigation from '@/components/Navigation';
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
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.7), rgba(26, 26, 26, 0.8)), url(${punkHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-4">
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

        {/* Inline Results Display */}
        {results && !isProcessing && (
          <div className="space-y-6 animate-fade-in">
            {/* Song title & metadata */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {song?.title || 'Your Recording'}
              </h1>
              <p className="text-lg font-medium text-gray-300">{song?.artist || ''}</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {analysis?.key && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white shadow-md">
                    Key: {analysis.key}
                  </span>
                )}
                {analysis?.tempo && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white shadow-md">
                    {analysis.tempo} BPM
                  </span>
                )}
                {analysis?.difficulty && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-700 text-gray-100 border border-gray-500 shadow-md">
                    {analysis.difficulty}
                  </span>
                )}
                {analysis?.real_data && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-600 text-white shadow-md">
                    AI Transcription
                  </span>
                )}
              </div>
            </div>

            {/* Fretboard with detected chords */}
            {chords.length > 0 && (
              <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl">
                <FretboardViewer
                  chords={chords}
                  currentChord={chords[0] || ''}
                  chordTimeline={chordTimeline}
                  currentTime={0}
                  onChordClick={() => {}}
                  instrument="guitar"
                  size="md"
                />
              </div>
            )}

            {/* Chord progression */}
            {chords.length > 0 && (
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Chord Progression</h3>
                <div className="flex gap-2 flex-wrap">
                  {chords.map((chord: string, i: number) => (
                    <span key={i} className="px-4 py-2 rounded-lg text-base font-bold bg-pink-600 text-white shadow-lg">
                      {chord}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis tips */}
            {analysis?.tips && (
              <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-300 font-medium">{analysis.tips}</p>
              </div>
            )}

            {/* Download buttons if real transcription files available */}
            {transcription?.sheet_music_available && (
              <div className="grid grid-cols-3 gap-2">
                {transcription.downloads?.pdf && (
                  <a href={transcription.downloads.pdf} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-3 bg-gray-800 text-white rounded-xl text-center text-sm font-bold hover:bg-gray-700 transition-colors border border-gray-600 shadow-md">
                    PDF Sheet Music
                  </a>
                )}
                {transcription.downloads?.midi && (
                  <a href={transcription.downloads.midi} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-3 bg-gray-800 text-white rounded-xl text-center text-sm font-bold hover:bg-gray-700 transition-colors border border-gray-600 shadow-md">
                    MIDI File
                  </a>
                )}
                {transcription.downloads?.gp5 && (
                  <a href={transcription.downloads.gp5} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-3 bg-gray-800 text-white rounded-xl text-center text-sm font-bold hover:bg-gray-700 transition-colors border border-gray-600 shadow-md">
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
                  window.location.reload();
                }}
                className="px-8 py-4 bg-pink-600 text-white rounded-xl font-black text-lg uppercase tracking-wide hover:bg-pink-500 transition-colors shadow-lg"
              >
                Record Again
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
    </div>
  );
};

export default Recording;
