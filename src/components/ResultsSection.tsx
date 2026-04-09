import React, { useState } from 'react';
import InteractiveAudioPlayer from './practice/InteractiveAudioPlayer';
import ChordDiagram from './ChordDiagram';
import EnhancedPracticeSection from './practice/EnhancedPracticeSection';
import { ClaudeMCPAssistant } from './ClaudeMCPAssistant';

interface ResultsSectionProps {
  results: any;
  originalAudio: Blob | null;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ results, originalAudio }) => {
  const [currentChord, setCurrentChord] = useState<string>('');
  
  if (!results) return null;

  // Helper function to format chord timeline
  const formatChordTimeline = (chordData: any[]) => {
    if (!chordData || chordData.length === 0) return [];
    
    return chordData.map(([start, end, chord]) => ({
      start: parseFloat(start),
      end: parseFloat(end),
      chord: chord === 'N' ? 'No Chord' : chord === 'X' ? 'Unknown' : chord,
      duration: parseFloat(end) - parseFloat(start)
    }));
  };

  const chordTimeline = results.transcription?.chord_timeline 
    ? formatChordTimeline(results.transcription.chord_timeline)
    : [];

  return (
    <section className="space-y-8 slide-in">
      <h2 className="punk-section-title text-center">🎵 CHORD RECOGNITION RESULTS</h2>
      
      {/* Real Data Indicator */}
      {results.analysis?.real_data && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-bold">REAL AI TRANSCRIPTION</span>
          </div>
        </div>
      )}
      
      {/* Interactive Audio Player */}
      {originalAudio && chordTimeline.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-center">🎸 INTERACTIVE PLAYER</h3>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InteractiveAudioPlayer 
                audioBlob={originalAudio}
                chordTimeline={chordTimeline}
                onChordChange={(chord, timestamp) => {
                  setCurrentChord(chord);
                  console.log(`Chord changed to ${chord} at ${timestamp}s`);
                }}
              />
            </div>
            <div className="flex justify-center">
              <ChordDiagram 
                chord={currentChord} 
                size="lg" 
                useFretboard={true}
                onChordClick={(chord) => setCurrentChord(chord)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Song Information */}
        <div className="punk-card">
          <h3 className="text-xl font-bold mb-4">
            {results.analysis?.real_data ? '🤖 AI ANALYSIS' : '📊 BASIC ANALYSIS'}
          </h3>
          <div className="space-y-3">
            <div>
              <strong>Title:</strong> {results.song.title}
            </div>
            <div>
              <strong>Source:</strong> {results.song.artist}
            </div>
            <div>
              <strong>Duration:</strong> {results.analysis.total_duration}s
            </div>
            <div>
              <strong>Confidence:</strong> {(results.song.confidence * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Data Source:</strong> 
              <span className={results.analysis?.real_data ? 'text-green-400' : 'text-yellow-400'}>
                {results.analysis?.real_data ? ' Real AI Analysis' : ' Enhanced Estimation'}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced AI Analysis */}
        <div className="punk-card">
          <h3 className="text-xl font-bold mb-4">PUNK ANALYSIS</h3>
          <div className="space-y-3">
            <div>
              <strong>Key:</strong> {results.analysis.key}
            </div>
            <div>
              <strong>Tempo:</strong> {results.analysis.tempo} BPM
            </div>
            <div>
              <strong>Difficulty:</strong> {results.analysis.difficulty}
            </div>
            <div>
              <strong>Unique Chords:</strong> {results.analysis.chord_count}
            </div>
            <div>
              <strong>Chord Changes:</strong> {results.analysis.chord_changes}
            </div>
            {results.analysis?.real_data && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded">
                <p className="text-sm text-green-400">
                  ✨ This analysis used real AI transcription from your live recording!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sheet Music Downloads */}
        {results.transcription && (results.transcription.sheet_music_available || results.transcription.midi_available || results.transcription.tabs_available) && (
          <div className="punk-card">
            <h3 className="text-xl font-bold mb-4">🎼 SHEET MUSIC & TABS</h3>
            <div className="space-y-3">
              {results.transcription.downloads?.pdf && (
                <a 
                  href={results.transcription.downloads.pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded hover:bg-muted/70 transition-colors"
                >
                  <div className="text-2xl">📄</div>
                  <div>
                    <div className="font-semibold">PDF Sheet Music</div>
                    <div className="text-sm text-muted-foreground">Professional notation for {results.transcription.instrument}</div>
                  </div>
                </a>
              )}
              {results.transcription.downloads?.midi && (
                <a 
                  href={results.transcription.downloads.midi} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded hover:bg-muted/70 transition-colors"
                >
                  <div className="text-2xl">🎹</div>
                  <div>
                    <div className="font-semibold">MIDI File</div>
                    <div className="text-sm text-muted-foreground">Import into your DAW or music software</div>
                  </div>
                </a>
              )}
              {results.transcription.downloads?.gp5 && (
                <a 
                  href={results.transcription.downloads.gp5} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded hover:bg-muted/70 transition-colors"
                >
                  <div className="text-2xl">🎸</div>
                  <div>
                    <div className="font-semibold">Guitar Pro File</div>
                    <div className="text-sm text-muted-foreground">Complete tabs with fingering and timing</div>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chord Timeline Section */}
      {chordTimeline.length > 0 && (
        <div className="punk-card">
          <h3 className="text-xl font-bold mb-4">🎸 CHORD TIMELINE</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {chordTimeline.map((segment, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-3 bg-muted/50 rounded border-l-4 border-primary"
              >
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-sm text-muted-foreground">
                    {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                  </span>
                  <span className="font-bold text-lg">
                    {segment.chord}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {segment.duration.toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Chords Summary */}
      {results.analysis.chords && results.analysis.chords.length > 0 && (
        <div className="punk-card">
          <h3 className="text-xl font-bold mb-4">DETECTED CHORDS</h3>
          <div className="flex flex-wrap gap-2">
            {results.analysis.chords.map((chord: string, index: number) => (
              <span 
                key={index}
                className="px-3 py-1 bg-primary/20 text-primary font-bold rounded border border-primary/40"
              >
                {chord}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tips */}
      <div className="punk-card">
        <h3 className="text-xl font-bold mb-4">🎸 PUNK ANALYSIS</h3>
        <p className="text-muted-foreground">{results.analysis.tips}</p>
      </div>

      {/* Claude MCP Assistant */}
      <ClaudeMCPAssistant 
        results={results} 
        audioUrl={results.analysis?.audio_url || results.song?.audio_url}
      />

      {/* Enhanced Practice Features */}
      <EnhancedPracticeSection 
        results={results}
        originalAudio={originalAudio}
        chordTimeline={chordTimeline}
      />
    </section>
  );
};

export default ResultsSection;