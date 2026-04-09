import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const HomeHeader = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold gradient-text">🎸 RIOT SHEETS</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>
    </section>
  );
};

export default HomeHeader;