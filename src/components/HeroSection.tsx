import React from 'react';
import punkHeroBg from '@/assets/punk-hero-bg.jpg';

const HeroSection = () => {
  return (
    <header 
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.7), rgba(26, 26, 26, 0.8)), url(${punkHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="punk-logo">RIOT SHEETS</h1>
        <p className="punk-tagline">Punk Rock Music Transcription</p>
        <div className="punk-badge">
          ⚡ SMASH YOUR AUDIO INTO SHEET MUSIC ⚡
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The ultimate "Shazam for Sheet Music" - Upload any audio and get instant punk rock transcriptions with AI-enhanced analysis!
        </p>
      </div>
    </header>
  );
};

export default HeroSection;