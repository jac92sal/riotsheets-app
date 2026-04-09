import React, { useEffect, useState } from 'react';
import CircularTimer from '@/components/CircularTimer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
interface MicrophoneSectionProps {
  onSubmitRecording: (audio: Blob) => void;
  isProcessing: boolean;
}
const MicrophoneSection: React.FC<MicrophoneSectionProps> = ({
  onSubmitRecording,
  isProcessing
}) => {
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  const {
    recorder,
    isPlayingRecording,
    error,
    startRecording,
    stopRecording,
    playRecording,
    startNewRecording
  } = useAudioRecorder();

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
  const submitRecording = () => {
    if (recorder.recordedAudio) {
      onSubmitRecording(recorder.recordedAudio);
      startNewRecording();
    }
  };
  return <div className="punk-card rounded-sm">
      <h3 className="text-xl font-bold mb-4 text-center">LIVE RECORDING</h3>
      
      {!browserSupported ? <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support audio recording.
          </p>
          <p className="text-xs text-muted-foreground">
            Please use Chrome, Firefox, or Safari for recording functionality.
          </p>
        </div> : !recorder.recordedAudio ? <CircularTimer isRecording={recorder.isRecording} timeLeft={recorder.timeLeft} maxTime={30} onStart={startRecording} onStop={stopRecording} disabled={isProcessing} /> : <div className="space-y-4 text-center">
          <div className="text-4xl">🎵</div>
          <p className="text-sm text-muted-foreground">Recording complete!</p>
          <div className="space-y-2">
            <button onClick={playRecording} className="punk-button-secondary w-full" disabled={isPlayingRecording}>
              {isPlayingRecording ? 'PLAYING...' : 'PLAY RECORDING'}
            </button>
            <button onClick={submitRecording} className="punk-button w-full" disabled={isProcessing}>
              SELECT ANALYSIS
            </button>
            <button onClick={startNewRecording} className="punk-button-secondary w-full">
              RECORD AGAIN
            </button>
          </div>
        </div>}
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        {recorder.isRecording ? '🔴 Recording in progress...' : 'Grant microphone permission when prompted'}
      </p>
      
      {error && <div className="mt-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
          <div className="font-semibold mb-1">⚠️ Recording Error</div>
          <div>{error}</div>
          {error.includes('not supported') && <div className="mt-2 text-xs">
              Try using Chrome, Firefox, or Safari for better recording support.
            </div>}
        </div>}
    </div>;
};
export default MicrophoneSection;