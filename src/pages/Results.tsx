
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { from } from '@/lib/api';
import { SheetMusicViewer } from '@/components/SheetMusicViewer';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Results = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAnalysisData = async () => {
      console.log('=== FETCHING ANALYSIS DATA ===');
      console.log('Analysis ID from URL params:', analysisId);
      console.log('Type of analysisId:', typeof analysisId);
      console.log('analysisId value:', JSON.stringify(analysisId));
      
      if (!analysisId) {
        console.error('No analysis ID provided in URL params');
        setError('Invalid analysis ID');
        setLoading(false);
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(analysisId)) {
        console.error('Invalid UUID format for analysisId:', analysisId);
        setError('Invalid analysis ID format');
        setLoading(false);
        return;
      }

      try {
        console.log('Making Supabase query for analysis ID:', analysisId);
        
        const { data, error } = await from('music_analyses')
          .select('*')
          .eq('id', analysisId)
          .single();

        console.log('Supabase query result:', { data, error });

        if (error) {
          console.error('Supabase error fetching analysis:', error);
          if (error.code === '22P02') {
            setError('Invalid analysis ID format');
          } else if (error.code === 'PGRST116') {
            setError('Analysis not found');
          } else {
            setError('Analysis not found or access denied');
          }
          return;
        }

        if (!data) {
          console.error('No analysis data returned from Supabase');
          setError('Analysis not found');
          return;
        }

        console.log('Analysis data loaded successfully:', data);
        setAnalysisData(data);
        
      } catch (error) {
        console.error('Exception while fetching analysis:', error);
        setError('Failed to load analysis results');
        toast({
          title: 'Error',
          description: 'Failed to load analysis results',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [analysisId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Analysis ID: {analysisId || 'Not provided'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recording
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SheetMusicViewer 
        analysisData={analysisData} 
        onBack={() => navigate('/')}
      />
    </div>
  );
};

export default Results;
