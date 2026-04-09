import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, Download, Edit, Maximize2, ZoomIn, ZoomOut, Star, Music, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import InteractiveAudioPlayer from '@/components/practice/InteractiveAudioPlayer';
import FretboardViewer from './FretboardViewer';

interface SheetMusicViewerProps {
  analysisData: any;
  onBack: () => void;
}

export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({ analysisData, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPart, setSelectedPart] = useState('all');
  const [zoom, setZoom] = useState([100]);
  const [rating, setRating] = useState(0);
  const [viewMode, setViewMode] = useState<'fretboard' | 'sheet'>('fretboard');
  const [currentTime, setCurrentTime] = useState(0);

  const results = analysisData?.analysis_results || {};
  const song = results.song || {};
  const analysis = results.analysis || {};
  const transcription = results.transcription || {};
  const chordTimeline = transcription.chord_timeline || results.chordTimeline || [];

  // Format chord timeline for display
  const formatChordTimeline = (chordData: any[]) => {
    if (!Array.isArray(chordData)) return [];
    return chordData.map((chord, index) => ({
      id: index,
      start: chord.time || chord.start || index,
      end: chord.end || (chord.time || chord.start || index) + 4,
      duration: chord.duration || 4,
      chord: chord.chord || chord.name || 'Unknown',
      confidence: chord.confidence || 0.8
    }));
  };

  const formattedChords = formatChordTimeline(chordTimeline);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = (format: string) => {
    console.log(`Downloading in ${format} format...`);
    // TODO: Implement actual download functionality
  };

  const availableParts = [
    { value: 'all', label: 'All Parts' },
    { value: 'vocal', label: 'Vocal' },
    { value: 'guitar', label: 'Guitar' },
    { value: 'bass', label: 'Bass' },
    { value: 'drums', label: 'Percussion' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Toolbar */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" onClick={handlePlay}>
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play Mode'}
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Note Editor
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'fretboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('fretboard')}
              >
                <Music className="h-4 w-4 mr-2" />
                Fretboard
              </Button>
              <Button
                variant={viewMode === 'sheet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('sheet')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Sheet Music
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Select value={selectedPart} onValueChange={setSelectedPart}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableParts.map((part) => (
                  <SelectItem key={part.value} value={part.value}>
                    {part.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={zoom}
                onValueChange={setZoom}
                max={200}
                min={50}
                step={10}
                className="w-20"
              />
              <ZoomIn className="h-4 w-4" />
              <span className="text-sm text-muted-foreground w-12">{zoom[0]}%</span>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sheet Music Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Song Information */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">{song.title || 'Unknown Song'}</h1>
              <p className="text-xl text-muted-foreground">
                {song.artist || 'Unknown Artist'}
              </p>
              {(analysis.key || song.key) && (
                <Badge variant="secondary" className="text-sm">
                  Key: {analysis.key || song.key}
                </Badge>
              )}
            </div>

            {/* Rating Section */}
            <Card>
              <CardHeader>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">How do you like the transcription?</h3>
                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating 
                              ? 'fill-primary text-primary' 
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Thanks for your feedback!
                    </p>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Music Display Area */}
            {viewMode === 'fretboard' ? (
              <FretboardViewer
                chords={formattedChords.map(c => c.chord)}
                currentChord={formattedChords.find(c => 
                  currentTime >= c.start && currentTime < c.end
                )?.chord || ''}
                chordTimeline={formattedChords.map(c => [c.start, c.end, c.chord])}
                currentTime={currentTime}
                onChordClick={(chord) => {
                  const chordEntry = formattedChords.find(c => c.chord === chord);
                  if (chordEntry) {
                    setCurrentTime(chordEntry.start);
                  }
                }}
                instrument="guitar"
                size="lg"
              />
            ) : (
              <Card className="min-h-[600px]">
                <CardContent className="p-8">
                  <div 
                    className="bg-white border-2 border-gray-200 rounded-lg p-8 min-h-[500px] flex items-center justify-center"
                    style={{ transform: `scale(${zoom[0] / 100})`, transformOrigin: 'top left' }}
                  >
                    {transcription.notation ? (
                      <div className="w-full">
                        {/* Musical notation would be rendered here */}
                        <div className="space-y-8">
                          <div className="text-center text-gray-600 mb-8">
                            <h4 className="text-lg font-semibold mb-2">Musical Notation</h4>
                            <p className="text-sm">Professional sheet music transcription</p>
                          </div>
                          
                          {/* Placeholder for actual notation rendering */}
                          <div className="space-y-6">
                            {[1, 2, 3, 4].map((line) => (
                              <div key={line} className="border-t border-gray-300 relative h-16">
                                <div className="absolute left-0 top-0 text-sm text-gray-500">
                                  {line}
                                </div>
                                {/* Musical notes would be positioned here */}
                                <div className="flex items-center h-full space-x-8 ml-8">
                                  {formattedChords.slice((line-1)*4, line*4).map((chord, index) => (
                                    <div key={index} className="text-center">
                                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm">
                                        {chord.chord}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Maximize2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Sheet Music Notation</h3>
                        <p>Professional notation will appear here</p>
                        {formattedChords.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3">Detected Chords:</h4>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {formattedChords.slice(0, 8).map((chord, index) => (
                                <Badge key={index} variant="outline">
                                  {chord.chord}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Expiration Notice */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-orange-800">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <p className="text-sm">
                    This file will expire in 30 days. Download now to keep your transcription.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Download Options */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Download Options</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => handleDownload('pdf')}
                  >
                    <Download className="h-5 w-5 mb-1" />
                    PDF Sheet Music
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => handleDownload('midi')}
                  >
                    <Download className="h-5 w-5 mb-1" />
                    MIDI File
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => handleDownload('gp5')}
                  >
                    <Download className="h-5 w-5 mb-1" />
                    Guitar Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side Panel for Audio Player and Controls */}
        <div className="w-80 border-l bg-card p-4 space-y-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Audio Playback</h3>
            
            {/* Audio Player */}
            {formattedChords.length > 0 && (
              <InteractiveAudioPlayer
                audioBlob={null} // Would need to fetch audio from storage
                chordTimeline={formattedChords}
                onTimeUpdate={(time) => setCurrentTime(time)}
              />
            )}

            {/* Song Details */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold">Song Details</h4>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tempo:</span>
                  <span>{analysis.tempo || song.tempo || 'Unknown'} BPM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Signature:</span>
                  <span>{song.timeSignature || '4/4'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{analysisData?.duration_seconds ? `${Math.round(analysisData.duration_seconds)}s` : 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Source:</span>
                  <span className="capitalize">{analysisData?.source_type || 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Detected Chords */}
            {formattedChords.length > 0 && (
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Chord Progression</h4>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formattedChords.map((chord, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="font-mono">{chord.chord}</span>
                        <span className="text-muted-foreground">
                          {Math.round(chord.start)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};