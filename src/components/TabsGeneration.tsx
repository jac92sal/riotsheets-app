import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TabsGenerationProps {
  songInfo: {
    title: string;
    artist: string;
    key?: string;
    chords?: string[];
  };
  chordProgression?: string[];
}

const TabsGeneration: React.FC<TabsGenerationProps> = ({ songInfo, chordProgression = [] }) => {
  const [selectedInstrument, setSelectedInstrument] = useState<'guitar' | 'bass' | 'drums'>('guitar');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [includeRhythm, setIncludeRhythm] = useState(false);
  const [generatedTabs, setGeneratedTabs] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateTabs = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate MCP tool call - in real implementation this would call the MCP server
      const tabData = await generateTabsData({
        song_info: {
          title: songInfo.title,
          artist: songInfo.artist,
          key: songInfo.key || 'C',
          chord_progression: chordProgression.length > 0 ? chordProgression : ['C', 'G', 'Am', 'F']
        },
        instrument: selectedInstrument,
        difficulty: selectedDifficulty,
        include_rhythm: includeRhythm
      });

      setGeneratedTabs(tabData);
      toast({
        title: 'Tabs Generated!',
        description: `${selectedInstrument} tabs created in ${selectedDifficulty} difficulty`,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate tabs. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyTabs = async () => {
    try {
      await navigator.clipboard.writeText(generatedTabs);
      toast({
        title: 'Copied!',
        description: 'Tabs copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy tabs to clipboard',
        variant: 'destructive'
      });
    }
  };

  const downloadTabs = () => {
    const blob = new Blob([generatedTabs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songInfo.title}-${selectedInstrument}-tabs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="punk-card space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">🎸 TAB GENERATION</h3>
        <p className="text-sm text-muted-foreground">
          Generate punk-style tabs for {songInfo.title}
        </p>
      </div>

      {/* Configuration */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Instrument</label>
          <Select value={selectedInstrument} onValueChange={(value: any) => setSelectedInstrument(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guitar">🎸 Guitar</SelectItem>
              <SelectItem value="bass">🔊 Bass</SelectItem>
              <SelectItem value="drums">🥁 Drums</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <Select value={selectedDifficulty} onValueChange={(value: any) => setSelectedDifficulty(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">🟢 Beginner</SelectItem>
              <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
              <SelectItem value="advanced">🔴 Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={generateTabs}
            disabled={isGenerating}
            className="w-full punk-button"
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE TABS'}
          </Button>
        </div>
      </div>

      {/* Chord Preview */}
      {chordProgression.length > 0 && (
        <div>
          <h4 className="font-bold mb-2">Detected Chords:</h4>
          <div className="flex flex-wrap gap-2">
            {chordProgression.map((chord, index) => (
              <Badge key={index} variant="secondary">
                {chord}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Generated Tabs */}
      {generatedTabs && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold">Generated Tabs:</h4>
            <div className="space-x-2">
              <Button onClick={copyTabs} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={downloadTabs} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
            {generatedTabs}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Tabs generated using punk rock patterns and power chords ⚡
      </div>
    </div>
  );
};

// Simulate the MCP tool functionality
async function generateTabsData(args: any) {
  const { song_info, instrument, difficulty, include_rhythm } = args;
  const { title, artist, key, chord_progression } = song_info;

  // This simulates the existing MCP tool logic
  const guitarTabs = {
    beginner: `// ${title} - ${artist} (Beginner Guitar)
// Key: ${key} | Chords: ${chord_progression.join(', ')}
// Tuning: Standard (E A D G B E)

[Verse] - Open Chords
e|--0--3--0--1--|
B|--1--0--1--1--|
G|--0--0--2--2--|
D|--2--0--2--3--|
A|--3--2--0--3--|
E|-----3-----1--|
  ${chord_progression.slice(0, 4).join('  ')}

[Power Chord Version] - Easier
e|----------------|
B|----------------|
G|--5-----2-------|
D|--5--5--2--3----|
A|--3--5--0--3----|
E|-----3-----1----|
  ${chord_progression.slice(0, 4).map(c => c + '5').join(' ')}`,

    intermediate: `// ${title} - ${artist} (Intermediate Guitar)
// Key: ${key} | Tempo: Fast punk rock
// Palm muted power chords with aggressive strumming

[Intro/Verse] - Palm Muted
e|----------------|
B|----------------|
G|--5-5-x-x-2-2-x-|
D|--5-5-5-5-2-2-3-|
A|--3-3-5-5-0-0-3-|
E|------3-3-----1-|
  C5   G5   Am  F5
  D U D U D U D U (strumming)

[Chorus] - Full power chords
e|--x--x--x--x---|
B|--x--x--x--x---|
G|--5--x--2--x---|
D|--5--5--2--3---|
A|--3--5--0--3---|
E|-----3-----1---|
  ${chord_progression.slice(0, 4).map(c => c + '5').join('  ')}`,

    advanced: `// ${title} - ${artist} (Advanced Guitar)
// Full punk arrangement with lead fills
// Fast alternate picking, palm muting

[Verse] - Rhythm + Lead fills
Rhythm:
e|----------------|
B|----------------|  
G|--5-5-x-x-2-2-x-|
D|--5-5-5-5-2-2-3-|
A|--3-3-5-5-0-0-3-|
E|------3-3-----1-|

Lead fills (12th fret area):
e|--12-10-8-12-10-8-7-5--|
B|------------------------|
G|------------------------|

[Solo Section] - Fast punk solo
e|--12-10-8-10-12-15-12-10-8-7-5-7-8--|
B|-----------------------------------|
G|-----------------------------------|
(Heavy distortion, fast alternate picking, attitude!)`
  };

  const bassTabs = {
    beginner: `// ${title} - ${artist} (Beginner Bass)
// Key: ${key} | Four-string bass tuning (E A D G)

[Basic Pattern] - Root notes
G|-----------------|
D|-----5-----2-----|
A|--3-----0-----3--|
E|---------------1-|
  C    G  Am    F

[Punk Rhythm] - Eighth note drive
G|-----------------|
D|-----5-5---2-2---|
A|--3-3---0-0---3-3|
E|--------------1-1|`,

    intermediate: `// ${title} - ${artist} (Intermediate Bass)  
// Driving punk bass with fills

[Verse] - Root-fifth movement
G|-----------------|
D|-----5-4-5-2-0-2-|
A|--3-3-----0------|
E|--------------1-3|

[Pre-Chorus Fill]
G|--5-3-2----------|
D|--------5-3-2----|
A|--------------3-1|
E|-----------------|`,

    advanced: `// ${title} - ${artist} (Advanced Bass)
// Complex punk bass with walking lines

[Verse] - Walking pattern
G|--5-3-2-0--------|
D|----------5-3-2-0|
A|--3-----0--------|
E|---------------1-|

[Breakdown] - Slap technique
G|-(pop)-3-(slap)--|
D|-------5---------|
A|--3----------3---|
E|-----------------|`
  };

  const drumTabs = {
    beginner: `// ${title} - ${artist} (Beginner Drums)
// Basic punk beat - keep it simple and driving

[Basic Pattern] - 4/4 punk beat
CC |x---------------|  (Crash)
HH |--x-x-x-x-x-x-x-|  (Hi-hat)
SD |----o-------o---|  (Snare)
BD |o-------o-------|  (Kick)

[Verse] 
CC |x---------------|
HH |--x-x-x-x-x-x-x-|
SD |----o-------o---|
BD |o-------o-------|

[Chorus] - More energy
CC |x-------x-------|
HH |--x-x-x---x-x-x-|
SD |----o-------o---|
BD |o---o---o---o---|`,

    intermediate: `// ${title} - ${artist} (Intermediate Drums)
// Punk fills and variations

[Verse Build]
CC |x---------------|
HH |--x-x-x-x-x-x-x-|
SD |----o-------o---|
BD |o-------o-o-----|

[Fill into Chorus]
CC |----------------|
HH |----------------|
SD |oooo-o-o-o-o-ooo|  (Fast snare roll)
BD |o---o---o---o---|
FT |----o-------o---|  (Floor tom)

[Chorus] - Driving beat
CC |x-------x-------|
HH |--x-x-x---x-x-x-|
SD |----o-------o---|
BD |o---o---o---o---|`,

    advanced: `// ${title} - ${artist} (Advanced Drums)
// Complex punk drumming with polyrhythms

[Verse] - Linear playing
CC |x---------------|
HH |--o-x-o-x-o-x-o-|  (Hi-hat foot work)
SD |----o-------o---|
BD |o-----o-o-------|

[Advanced Fill]
CC |----------------|
HH |----------------|
SD |o-oo-o-o-oo-o-oo|  (Linear snare)
BD |o---o---o---o---|
HT |--o---o---o-----|  (High tom)
FT |----o-------o---|

[Breakdown] - Half-time feel
CC |x-------x-------|
HH |--o---o---o---o-|
SD |----o-------o---|
BD |o-----------o---|`
  };

  let selectedTabs;
  switch (instrument) {
    case 'bass':
      selectedTabs = bassTabs[difficulty as keyof typeof bassTabs] || bassTabs.beginner;
      break;
    case 'drums':
      selectedTabs = drumTabs[difficulty as keyof typeof drumTabs] || drumTabs.beginner;
      break;
    default:
      selectedTabs = guitarTabs[difficulty as keyof typeof guitarTabs] || guitarTabs.intermediate;
  }

  const rhythmNotation = include_rhythm ? `

[Rhythm Guide]
D = Down stroke    U = Up stroke    
x = Muted strum    o = Open hit    
- = Rest           ^ = Accent` : '';

  return selectedTabs + rhythmNotation + `

[Practice Tips for ${difficulty}]
- Start slow and build up tempo gradually
- Focus on timing over speed - use a metronome!
- Practice chord changes separately first
- Channel that punk attitude and energy!
- Play with conviction - punk is about attitude! 🤘`;
}

export default TabsGeneration;
