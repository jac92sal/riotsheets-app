// Enhanced audio recorder with better format support
import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  timeLeft: number;
  recordedAudio: Blob | null;
}

// Better MIME type selection for API compatibility
const getSupportedMimeType = (): string => {
  const types = [
    'audio/wav', // Best for processing
    'audio/mp4', // Good compatibility
    'audio/webm;codecs=opus',
    'audio/webm'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using MIME type:', type);
      return type;
    }
  }
  
  console.warn('No preferred MIME type found, using default');
  return 'audio/wav';
};

export const useAudioRecorder = () => {
  const [recorder, setRecorder] = useState<AudioRecorderState>({
    isRecording: false,
    mediaRecorder: null,
    timeLeft: 30,
    recordedAudio: null
  });
  const [isPlayingRecording, setIsPlayingRecording] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Timer countdown effect
  useEffect(() => {
    if (recorder.isRecording && recorder.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setRecorder(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            if (prev.mediaRecorder && prev.mediaRecorder.state === 'recording') {
              prev.mediaRecorder.stop();
            }
            return { ...prev, timeLeft: 0, isRecording: false };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [recorder.isRecording, recorder.timeLeft]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting recording...');
      setError('');
      
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('MediaRecorder not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100, // Standard sample rate
          channelCount: 2, // Stereo for better quality
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true // Add gain control
        }
      });

      const mimeType = getSupportedMimeType();
      
      // Enhanced MediaRecorder options
      const options: MediaRecorderOptions = { 
        mimeType,
        audioBitsPerSecond: 128000 // Higher quality
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing', audioChunksRef.current.length, 'chunks');
        
        try {
          let audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
          
          // Convert to WAV if not already (for better API compatibility)
          if (!mimeType.includes('wav')) {
            audioBlob = await convertToWav(audioBlob);
            console.log('Converted to WAV:', audioBlob.size, 'bytes');
          }
          
          setRecorder(prev => ({ 
            ...prev, 
            recordedAudio: audioBlob, 
            isRecording: false 
          }));
          
        } catch (conversionError) {
          console.error('Audio conversion error:', conversionError);
          // Fallback to original blob
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          setRecorder(prev => ({ 
            ...prev, 
            recordedAudio: audioBlob, 
            isRecording: false 
          }));
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
      };

      mediaRecorder.start(1000); // Collect data every second
      console.log('MediaRecorder started with options:', options);
      
      setRecorder(prev => ({
        ...prev,
        isRecording: true,
        mediaRecorder,
        timeLeft: 30,
        recordedAudio: null
      }));

    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      
      let errorMessage = 'Recording failed. ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please grant microphone permission and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please check your audio devices.';
      } else if (error.message.includes('not supported')) {
        errorMessage += 'Recording not supported in this browser. Try Chrome or Firefox.';
      } else {
        errorMessage += 'Please check your microphone and try again.';
      }
      
      setError(errorMessage);
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (recorder.mediaRecorder && recorder.mediaRecorder.state === 'recording') {
      recorder.mediaRecorder.stop();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  }, [recorder.mediaRecorder]);

  const playRecording = useCallback(async () => {
    if (recorder.recordedAudio && !isPlayingRecording) {
      console.log('Playing recording...');
      try {
        const audioUrl = URL.createObjectURL(recorder.recordedAudio);
        audioRef.current = new Audio(audioUrl);
        
        setIsPlayingRecording(true);
        
        audioRef.current.onended = () => {
          setIsPlayingRecording(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audioRef.current.onerror = () => {
          console.error('Audio playback failed');
          setIsPlayingRecording(false);
          URL.revokeObjectURL(audioUrl);
          setError('Cannot play recording - please try recording again');
        };
        
        await audioRef.current.play();
        
      } catch (error) {
        console.error('Error playing recording:', error);
        setError('Cannot play recording - audio format issue');
        setIsPlayingRecording(false);
      }
    }
  }, [recorder.recordedAudio, isPlayingRecording]);

  const startNewRecording = useCallback(() => {
    console.log('Starting new recording...');
    setRecorder(prev => ({ ...prev, recordedAudio: null, timeLeft: 30 }));
    audioChunksRef.current = [];
    setError('');
  }, []);

  return {
    recorder,
    isPlayingRecording,
    error,
    setError,
    startRecording,
    stopRecording,
    playRecording,
    startNewRecording
  };
};

// Convert audio to WAV format for better API compatibility
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create WAV file
    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.warn('WAV conversion failed, using original:', error);
    return audioBlob;
  }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}