import React, { useState, useEffect } from 'react';
import { from, storage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Music, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MusicAnalysis {
  id: string;
  created_at: string;
  original_filename: string;
  instrument: string;
  source_type: string;
  processing_status: string;
  analysis_results: any;
  sheet_music_pdf_path: string | null;
  sheet_music_midi_path: string | null;
  sheet_music_gp5_path: string | null;
  duration_seconds: number | null;
}

export const MusicAnalysisHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<MusicAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await from('music_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load your music analyses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await storage
        .from('sheet-music')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Download Started", description: `Downloading ${fileName}` });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: "Download Error", description: "Failed to download file", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing': return <Badge variant="secondary">Processing</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading your music analyses...</p>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center p-8">
        <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
        <p className="text-muted-foreground">
          Upload or record some audio to get started with music analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Music className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Your Music Analyses</h2>
      </div>

      {analyses.map((analysis) => (
        <Card key={analysis.id} className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {analysis.original_filename}
              </CardTitle>
              {getStatusBadge(analysis.processing_status)}
            </div>
            <CardDescription>
              {analysis.instrument} • {analysis.source_type} •
              {formatDuration(analysis.duration_seconds)} •
              {new Date(analysis.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>

          {analysis.processing_status === 'completed' && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.sheet_music_pdf_path && (
                  <Button variant="outline" size="sm"
                    onClick={() => downloadFile(analysis.sheet_music_pdf_path!, `${analysis.original_filename.split('.')[0]}.pdf`)}
                    className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                )}
                {analysis.sheet_music_midi_path && (
                  <Button variant="outline" size="sm"
                    onClick={() => downloadFile(analysis.sheet_music_midi_path!, `${analysis.original_filename.split('.')[0]}.midi`)}
                    className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> MIDI
                  </Button>
                )}
                {analysis.sheet_music_gp5_path && (
                  <Button variant="outline" size="sm"
                    onClick={() => downloadFile(analysis.sheet_music_gp5_path!, `${analysis.original_filename.split('.')[0]}.gp5`)}
                    className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> GP5
                  </Button>
                )}
              </div>

              {analysis.analysis_results?.analysis && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Analysis Summary:</p>
                  <p className="text-sm text-muted-foreground">
                    Key: {analysis.analysis_results.analysis.key} •
                    Tempo: {analysis.analysis_results.analysis.tempo} BPM •
                    Difficulty: {analysis.analysis_results.analysis.difficulty} •
                    {analysis.analysis_results.analysis.chord_count} chords detected
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
