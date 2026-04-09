import React, { useState } from 'react';
import { functions } from '@/lib/api';

interface YouTubeSectionProps {
  isProcessing: boolean;
  onYouTubeProcess: (audioData: string, metadata: any) => void;
}

const YouTubeSection: React.FC<YouTubeSectionProps> = ({ isProcessing, onYouTubeProcess }) => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [videoPreview, setVideoPreview] = useState<any>(null);

  const handleYouTubeProcess = async () => {
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL.');
      return;
    }

    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setIsExtracting(true);
    setError('');
    setVideoPreview(null);

    try {
      console.log('Extracting audio from YouTube URL:', youtubeUrl);

      // Call the YouTube audio extraction edge function
      const { data, error } = await functions.invoke('youtube-to-audio', {
        body: { url: youtubeUrl }
      });

      if (error) {
        throw new Error(error.message || 'Failed to extract audio from YouTube');
      }

      if (data.status === 'error') {
        throw new Error(data.error);
      }

      // Set video preview metadata
      setVideoPreview(data.metadata);

      // Pass the extracted audio data to the parent for chord processing
      onYouTubeProcess(data.audioData, data.metadata);

    } catch (error) {
      console.error('YouTube processing error:', error);
      setError(error.message || 'Failed to process YouTube video. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="punk-card">
      <h3 className="text-xl font-bold mb-4 text-center">YOUTUBE LINK</h3>
      <div className="space-y-4">
        <div className="text-4xl text-center">🔗</div>
        
        {/* Video Preview */}
        {videoPreview && (
          <div className="p-3 bg-muted/50 rounded border">
            <div className="flex items-center space-x-3">
              {videoPreview.thumbnailUrl && (
                <img 
                  src={videoPreview.thumbnailUrl} 
                  alt="Video thumbnail"
                  className="w-16 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{videoPreview.title}</p>
                <p className="text-xs text-muted-foreground">{videoPreview.channelTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Duration: {Math.floor(videoPreview.duration / 60)}:{(videoPreview.duration % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="punk-input w-full"
          disabled={isProcessing || isExtracting}
        />
        
        <button
          onClick={handleYouTubeProcess}
          className="punk-button-secondary w-full"
          disabled={isProcessing || isExtracting}
        >
          {isExtracting ? 'EXTRACTING AUDIO...' : 'PROCESS YOUTUBE URL'}
        </button>
        
        {isExtracting && (
          <div className="text-center space-y-2">
            <div className="loading-spinner w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">Extracting audio from YouTube...</p>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          Extract chords from any YouTube video!
        </p>
        
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeSection;