import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, Minimize2, Maximize2, Music, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  toolCalls?: ToolCall[];
  analysis?: any;
}

interface ToolCall {
  name: string;
  input: any;
  output: any;
  success: boolean;
}

interface ClaudeMCPAssistantProps {
  results?: any;
  className?: string;
  audioUrl?: string;
}

export const ClaudeMCPAssistant: React.FC<ClaudeMCPAssistantProps> = ({ 
  results, 
  className,
  audioUrl 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mcpConnectionStatus, setMcpConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize MCP connection
    initializeMCPConnection();
    
    // Add welcome message if we have audio to analyze
    if (audioUrl && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: `🎸 Hey there, punk rocker! I can see you've uploaded some audio. I'm Claude, your AI music mentor, and I've got some serious tools at my disposal to help you master this track.

I can automatically:
• **Identify the song** using acoustic fingerprinting
• **Analyze the chord progression** and musical structure  
• **Generate tabs** for guitar, bass, or drums
• **Provide punk-specific practice tips** and techniques

Just ask me something like "What song is this?" or "Show me the guitar tabs" and I'll use my music analysis tools to give you the real deal!

What would you like to know about your track? 🤘`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [audioUrl]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeMCPConnection = async () => {
    try {
      // Test MCP server health
      const response = await fetch(`${getMCPServerUrl()}/health`);
      if (response.ok) {
        setMcpConnectionStatus('connected');
      } else {
        setMcpConnectionStatus('error');
      }
    } catch (error) {
      console.error('MCP connection failed:', error);
      setMcpConnectionStatus('error');
    }
  };

  const getMCPServerUrl = () => {
    // In production, this would be your Cloudflare Worker URL
    return 'https://riotsheetsappreggie.reggie78757.workers.dev';
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call Claude with MCP tools
      const response = await callClaudeWithMCP(inputMessage, audioUrl);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
        analysis: response.analysis
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting to my music analysis tools right now. Please try again in a moment! 🎸",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const callClaudeWithMCP = async (message: string, audioUrl?: string) => {
    // This would integrate with Claude's MCP Connector
    // For now, we'll simulate the interaction with our MCP server
    
    const mcpServerUrl = getMCPServerUrl();
    
    // Determine which tools Claude might need based on the message
    const needsIdentification = message.toLowerCase().includes('what song') || 
                               message.toLowerCase().includes('identify') ||
                               message.toLowerCase().includes('name of');
    
    const needsAnalysis = message.toLowerCase().includes('analyze') ||
                         message.toLowerCase().includes('chord') ||
                         message.toLowerCase().includes('key') ||
                         message.toLowerCase().includes('tempo');
    
    const needsTabs = message.toLowerCase().includes('tab') ||
                     message.toLowerCase().includes('guitar') ||
                     message.toLowerCase().includes('bass') ||
                     message.toLowerCase().includes('drum');

    let toolCalls: ToolCall[] = [];
    let analysisResults: any = {};

    // Simulate Claude calling MCP tools based on user intent
    if (audioUrl && needsIdentification) {
      try {
        const identifyResult = await callMCPTool('identify_song', { audio_url: audioUrl });
        toolCalls.push({
          name: 'identify_song',
          input: { audio_url: audioUrl },
          output: identifyResult,
          success: true
        });
        analysisResults.identification = identifyResult;
      } catch (error) {
        toolCalls.push({
          name: 'identify_song',
          input: { audio_url: audioUrl },
          output: { error: error.message },
          success: false
        });
      }
    }

    if (audioUrl && needsAnalysis) {
      try {
        const analysisResult = await callMCPTool('analyze_music', { 
          audio_url: audioUrl, 
          analysis_type: 'punk_analysis' 
        });
        toolCalls.push({
          name: 'analyze_music',
          input: { audio_url: audioUrl, analysis_type: 'punk_analysis' },
          output: analysisResult,
          success: true
        });
        analysisResults.musicAnalysis = analysisResult;
      } catch (error) {
        toolCalls.push({
          name: 'analyze_music',
          input: { audio_url: audioUrl, analysis_type: 'punk_analysis' },
          output: { error: error.message },
          success: false
        });
      }
    }

    if (needsTabs) {
      const instrument = message.toLowerCase().includes('bass') ? 'bass' :
                        message.toLowerCase().includes('drum') ? 'drums' : 'guitar';
      
      try {
        const tabsResult = await callMCPTool('get_tabs', { 
          instrument,
          song_info: analysisResults.identification || {},
          difficulty: 'intermediate'
        });
        toolCalls.push({
          name: 'get_tabs',
          input: { instrument, difficulty: 'intermediate' },
          output: tabsResult,
          success: true
        });
        analysisResults.tabs = tabsResult;
      } catch (error) {
        toolCalls.push({
          name: 'get_tabs',
          input: { instrument, difficulty: 'intermediate' },
          output: { error: error.message },
          success: false
        });
      }
    }

    // Generate Claude's response based on the tool results
    const claudeResponse = generateClaudeResponse(message, toolCalls, analysisResults);

    return {
      text: claudeResponse,
      toolCalls,
      analysis: analysisResults
    };
  };

  const callMCPTool = async (toolName: string, input: any) => {
    const response = await fetch(`${getMCPServerUrl()}/sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: input
        }
      })
    });

    if (!response.ok) {
      throw new Error(`MCP tool call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  };

  const generateClaudeResponse = (message: string, toolCalls: ToolCall[], analysis: any): string => {
    // This simulates Claude's intelligent response generation based on tool results
    let response = '';

    if (analysis.identification) {
      const song = analysis.identification.identification || analysis.identification;
      response += `🎵 **Song Identified!**\n\n`;
      response += `**"${song.title}"** by **${song.artist}**\n`;
      if (song.album) response += `From the album: *${song.album}* (${song.year})\n`;
      response += `Genre: ${song.genre} | Tempo: ${song.bpm} BPM | Key: ${song.key}\n\n`;
      
      if (song.punk_analysis?.is_punk) {
        response += `🤘 **Punk Analysis:**\n`;
        response += `This is a solid ${song.punk_analysis.punk_subgenre} track with ${song.punk_analysis.energy_level.toLowerCase()} energy. `;
        response += `Perfect for practicing ${song.punk_analysis.chord_simplicity.toLowerCase()} chord progressions!\n\n`;
      }
    }

    if (analysis.musicAnalysis) {
      const music = analysis.musicAnalysis.analysis || analysis.musicAnalysis;
      response += `🎸 **Musical Analysis:**\n\n`;
      response += `**Key:** ${music.key} | **Tempo:** ${music.tempo} BPM | **Time Signature:** ${music.time_signature}\n`;
      
      if (music.chord_names) {
        response += `**Chord Progression:** ${music.chord_names.join(' - ')}\n`;
      }
      
      if (music.punk_characteristics) {
        response += `\n**Punk Characteristics:**\n`;
        if (music.punk_characteristics.power_chords) response += `✅ Power chords detected\n`;
        if (music.punk_characteristics.fast_tempo) response += `✅ Fast, driving tempo\n`;
        if (music.punk_characteristics.driving_rhythm) response += `✅ Aggressive, driving rhythm\n`;
        response += `\n**Punk Rating:** ${music.punk_rating}/10\n`;
      }

      if (music.practice_recommendations) {
        response += `\n**Practice Tips:**\n`;
        music.practice_recommendations.forEach((tip: string) => {
          response += `• ${tip}\n`;
        });
      }
    }

    if (analysis.tabs) {
      const tabs = analysis.tabs.tabs || analysis.tabs;
      response += `\n🎼 **Tabs Generated:**\n\n`;
      response += `\`\`\`\n${tabs}\n\`\`\`\n`;
    }

    // If no tools were called successfully, provide general advice
    if (toolCalls.length === 0 || !toolCalls.some(call => call.success)) {
      response = `I'd love to help you analyze your music! To get the most out of our session, try asking me specific questions like:

• "What song is this?" - I'll identify the track using acoustic fingerprinting
• "Analyze this music" - I'll break down the chords, tempo, and punk characteristics  
• "Show me guitar tabs" - I'll generate tabs based on the analysis
• "What's the chord progression?" - I'll extract the harmonic structure

Upload some audio and let's dive into the punk rock theory together! 🤘`;
    }

    return response;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isExpanded) {
    return (
      <Card className={cn("fixed bottom-4 right-4 w-80 shadow-xl z-50", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">Claude MCP Assistant</CardTitle>
              <div className={cn(
                "w-2 h-2 rounded-full",
                mcpConnectionStatus === 'connected' ? "bg-green-500" :
                mcpConnectionStatus === 'connecting' ? "bg-yellow-500" : "bg-red-500"
              )} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground mb-3">
            Your AI punk rock mentor with real-time music analysis tools!
          </p>
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full"
            size="sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Chatting
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col", className)}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Claude MCP Assistant</CardTitle>
            <div className={cn(
              "w-2 h-2 rounded-full",
              mcpConnectionStatus === 'connected' ? "bg-green-500" :
              mcpConnectionStatus === 'connecting' ? "bg-yellow-500" : "bg-red-500"
            )} />
            {mcpConnectionStatus === 'connected' && <Zap className="h-3 w-3 text-green-500" />}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-3">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-3 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                      <div className="text-xs text-muted-foreground mb-1">Tools used:</div>
                      {message.toolCalls.map((call, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            call.success ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span>{call.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Analyzing with MCP tools...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your music..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};