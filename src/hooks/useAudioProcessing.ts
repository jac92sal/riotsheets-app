
// Enhanced unified audio processing hook
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { functions } from '@/lib/api';
import { INSTRUMENTS } from '@/components/InstrumentSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AnalysisSelection } from '@/components/AudioAnalysisModal';

export const useAudioProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { incrementUsage, user } = useAuth();
  const { toast } = useToast();
  const [selectedInstrument, setSelectedInstrument] = useState<string>('piano');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [originalAudio, setOriginalAudio] = useState<Blob | null>(null);
  const [autoOpenMic, setAutoOpenMic] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [pendingAudio, setPendingAudio] = useState<File | Blob | null>(null);
  const [audioSource, setAudioSource] = useState<'file' | 'microphone' | 'youtube'>('file');
  const isMobile = useIsMobile();

  // Load data from navigation state
  useEffect(() => {
    if (location.state) {
      const { results: navResults, originalAudio: navAudio, selectedInstrument: navInstrument, error: navError } = location.state;
      if (navResults) setResults(navResults);
      if (navAudio) setOriginalAudio(navAudio);
      if (navInstrument) setSelectedInstrument(navInstrument);
      if (navError) setError(navError);
    }
  }, [location.state]);

  // Auto-open microphone on mobile if no results
  useEffect(() => {
    if (isMobile && !results) {
      setAutoOpenMic(true);
    }
  }, [isMobile, results]);

  // Enhanced error handling
  const handleError = (error: any, context: string) => {
    console.error(`${context} error:`, error);
    
    let userMessage = 'Processing failed. ';
    const errorMsg = error?.message || String(error);
    
    if (errorMsg.includes('authentication') || errorMsg.includes('401')) {
      userMessage += 'Authentication issue - please try signing in again.';
    } else if (errorMsg.includes('format') || errorMsg.includes('400')) {
      userMessage += 'Audio format not supported. Try recording again.';
    } else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      userMessage += 'Processing timed out. Try a shorter recording.';
    } else if (errorMsg.includes('usage') || errorMsg.includes('limit')) {
      userMessage += 'Daily usage limit reached. Please sign up for unlimited access.';
    } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      userMessage += 'Network error. Check your connection and try again.';
    } else {
      userMessage += 'Please try again or contact support if the issue persists.';
    }
    
    setError(userMessage);
    toast({
      title: 'Processing Failed',
      description: userMessage,
      variant: 'destructive',
    });
  };

  // YouTube Processing with better error handling
  const handleYouTubeProcess = async (audioData: string, metadata: any) => {
    setIsProcessing(true);
    setError('');
    
    try {
      console.log('Processing YouTube audio with metadata:', metadata);

      // Check usage limit first
      const canProceed = await incrementUsage();
      if (!canProceed) {
        setIsProcessing(false);
        return;
      }

      const instrumentName = INSTRUMENTS.find(i => i.id === selectedInstrument)?.name || 'Unknown';

      const { data, error } = await functions.invoke('identify-song', {
        body: {
          audioData: audioData,
          instrument: instrumentName,
          source: 'youtube'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process YouTube audio');
      }

      if (data.status === 'error') {
        throw new Error(data.error || 'YouTube processing failed');
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
      try {
        const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
        const audioBlob = new Blob([binaryData], { type: 'audio/mp3' });
        setOriginalAudio(audioBlob);
      } catch (conversionError) {
        console.warn('Could not create audio blob for playback:', conversionError);
      }

      toast({
        title: 'Success!',
        description: 'YouTube audio processed successfully',
      });

    } catch (error) {
      handleError(error, 'YouTube processing');
    } finally {
      setIsProcessing(false);
    }
  };

  // Directly process audio for guitar transcription (no modal)
  const handleAudioReady = async (audioData: File | Blob, source: 'file' | 'microphone' | 'youtube') => {
    console.log('🎸 AUDIO READY - Starting direct guitar transcription');
    console.log('🎸 Source:', source, 'Size:', audioData.size, 'bytes');
    
    // Start processing immediately - no modal, just guitar transcription
    await handleDirectTranscription(audioData, source);
  };

  // Direct guitar transcription processing
  const handleDirectTranscription = async (audioData: File | Blob, source: 'file' | 'microphone' | 'youtube') => {
    console.log('🎸 Starting direct guitar transcription...');
    setIsProcessing(true);
    setError('');
    setOriginalAudio(audioData);

    // Add timeout for long-running requests (increased for real transcription)
    const TIMEOUT_MS = 120000; // 2 minutes for real transcription
    let timeoutId: NodeJS.Timeout;

    try {
      console.log('🎸 Checking usage limits...');

      // Check usage limit first - this now handles both anonymous and authenticated users
      const canProceed = await incrementUsage();
      if (!canProceed) {
        console.log('🎸 Usage limit reached, stopping processing');
        setIsProcessing(false);
        return;
      }

      console.log('🎸 Usage check passed, proceeding with transcription');

      // File size validation (limit to 10MB for real-time processing)
      const maxSize = 10 * 1024 * 1024;
      if (audioData.size > maxSize) {
        throw new Error('Audio file too large. Please use a file under 10MB for real-time transcription.');
      }

      // Minimum size validation (more realistic for live recording)
      if (audioData.size < 5000) {
        throw new Error('Audio file too small. Please record for at least 5 seconds.');
      }

      console.log('🎸 File size validation passed:', audioData.size, 'bytes');
      
      // Convert audio to file if needed
      const audioFile = audioData instanceof File 
        ? audioData 
        : new File([audioData], 'recording.wav', { type: 'audio/wav' });
      
      // Convert audio to base64 for API call
      console.log('🎸 Converting audio to base64...');
      const base64Audio = await convertToBase64(audioFile);
      console.log('🎸 Base64 conversion complete, length:', base64Audio.length);

      // Make direct call to real-time guitar transcription endpoint
      console.log('🎸 Starting REAL guitar transcription API call...');
      toast({
        title: "🎸 Real-Time Transcription...",
        description: "AI is analyzing your live guitar recording!"
      });

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Real-time transcription timed out. Try a shorter recording or check your connection.'));
        }, TIMEOUT_MS);
      });

      console.log('🎸 Calling identify-song function for REAL guitar transcription...');
      const transcriptionPromise = functions.invoke('identify-song', {
        body: {
          audioData: base64Audio,
          realTime: true,
          instrument: 'guitar'
        }
      });

      const { data, error } = await Promise.race([transcriptionPromise, timeoutPromise]) as any;

      // Clear timeout if request completed
      if (timeoutId) clearTimeout(timeoutId);

      console.log('🎸 REAL Transcription API Response:', { 
        hasData: !!data, 
        hasError: !!error,
        realData: data?.analysis?.real_data,
        transcriptionAvailable: data?.analysis?.transcription_available
      });

      if (error) {
        console.error('🎸 Transcription function error:', error);
        throw new Error(error.message || 'Real-time guitar transcription failed');
      }

      if (!data) {
        console.error('🎸 No transcription data returned');
        throw new Error('No transcription data returned');
      }

      if (data?.status === 'error') {
        console.error('🎸 Transcription returned error:', data);
        throw new Error(data.error || data.technical_error || 'Real-time guitar transcription failed');
      }

      console.log('Guitar transcription result:', {
        success: true,
        realData: data.analysis?.real_data,
        chordCount: data.analysis?.chord_count,
        hasTranscription: data.transcription?.real_transcription
      });
      const transcriptionResults = data;

      // Add metadata for direct transcription
      transcriptionResults.directTranscription = true;
      transcriptionResults.instrument = 'Guitar';
      transcriptionResults.realTimeProcessing = true;

      // The edge function already saves to DB for authenticated users and returns analysisId.
      // Use that ID to navigate if available; otherwise show results inline.
      if (user && transcriptionResults.analysisId) {
        console.log('Navigating to saved analysis:', transcriptionResults.analysisId);
        navigate(`/results/${transcriptionResults.analysisId}`, { replace: true });
        return;
      }

      // Show results inline (anonymous users, or if edge function didn't save)
      console.log('Showing results inline');
      setResults(transcriptionResults);
      
      toast({
        title: transcriptionResults.analysis?.real_data ? '🎸 Real Transcription Complete!' : '🎸 Analysis Complete!',
        description: transcriptionResults.analysis?.real_data 
          ? 'AI-powered sheet music generated from your live recording!'
          : 'Chord analysis complete - upgrade for full transcription!'
      });

    } catch (error) {
      console.error('🎸 Real-time guitar transcription failed:', error);
      handleError(error, 'Real-time guitar transcription');
    } finally {
      // Ensure cleanup happens
      if (timeoutId) clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };

  // Legacy function for modal-based analysis (kept for compatibility)  
  const handleAnalysisConfirm = async (selection: AnalysisSelection) => {
    console.log('🎸 Modal-based analysis (legacy) - redirecting to direct transcription');
    if (!pendingAudio) return;
    await handleDirectTranscription(pendingAudio, audioSource);
  };

  // Helper function to convert File/Blob to base64
  const convertToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Legacy audio processing for backward compatibility
  const handleAudioProcessing = async (audioData: File | Blob) => {
    handleAudioReady(audioData, audioData instanceof File ? 'file' : 'microphone');
  };

  return {
    selectedInstrument,
    setSelectedInstrument,
    isProcessing,
    results,
    error,
    originalAudio,
    autoOpenMic,
    showAnalysisModal,
    setShowAnalysisModal,
    audioSource,
    handleYouTubeProcess,
    handleAudioProcessing,
    handleAudioReady,
    handleAnalysisConfirm
  };
};
