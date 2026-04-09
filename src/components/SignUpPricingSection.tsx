import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Crown, Star, CheckCircle, XCircle } from 'lucide-react';

// Add Stripe script to document head
const addStripeScript = () => {
  if (!document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.head.appendChild(script);
  }
};

const SignUpPricingSection = () => {
  const navigate = useNavigate();
  const { user, session, subscription } = useAuth();
  const { 
    handleManageSubscription, 
    getTierDisplay,
    monthly_analyses_used,
    monthly_analyses_limit,
    usagePercentage } = useSubscriptionManagement(user, session, subscription);

  useEffect(() => {
    addStripeScript();
  }, []);

  // If user is logged in, show upgrade section instead
  if (user) {
    return (
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="punk-section-title">⚡ LEVEL UP YOUR PUNK ANALYSIS ⚡</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {subscription?.subscribed 
              ? `You're rocking the ${subscription.subscription_tier?.replace('_', ' ').toUpperCase()} plan!`
              : "Ready to unlock the full power of RIOT SHEETS?"
            }
          </p>
        </div>

        {/* Current Usage Status */}
        {subscription && (
          <Card className="punk-card max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Crown className="h-5 w-5" />
                Your Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Badge className="bg-primary">
                {subscription.subscription_tier?.replace('_', ' ').toUpperCase() || 'FREE REBEL'}
              </Badge>              
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-bold">{monthly_analyses_used}</span> / 
                  <span className="font-bold">{monthly_analyses_limit}</span> analyses used
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((subscription.monthly_analyses_used / subscription.monthly_analyses_limit) * 100, 100)}%` 
                    }}                    
                  />
                </div>
              </div>
              {!subscription.subscribed && monthly_analyses_used >= monthly_analyses_limit && (
                <div className="text-destructive font-bold flex items-center justify-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Monthly limit reached!
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA */}
        {!subscription?.subscribed && (
          <div className="text-center">
            <Button onClick={() => navigate('/pricing')} className="punk-button text-lg px-8 py-4">
              <Zap className="h-5 w-5 mr-2" />
              Upgrade Now & Keep Rockin'
            </Button>
          </div>
        )}
      </section>
    );
  }

  // For non-logged in users, show sign-up and pricing
  return (
    <section className="space-y-12">
      {/* Sign Up CTA */}
      <div className="text-center space-y-6">
        <h2 className="punk-section-title">🔥 JOIN THE PUNK REVOLUTION 🔥</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ready to turn your audio into punk masterpieces? Sign up now and start analyzing your music with AI-powered precision!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/auth')} className="punk-button text-lg px-8 py-4">
            <Star className="h-5 w-5 mr-2" />
            Start Free - Sign Up Now
          </Button>
          <Button variant="outline" onClick={() => navigate('/pricing')} className="text-lg px-8 py-4">
            View All Plans
          </Button>
        </div>
      </div>

      {/* Quick Benefits */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="punk-card text-center">
          <CardContent className="p-6">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Instant Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Upload, record, or paste YouTube links - get results in seconds
            </p>
          </CardContent>
        </Card>
        
        <Card className="punk-card text-center">
          <CardContent className="p-6">
            <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI recognizes chords, tempo, and difficulty levels
            </p>
          </CardContent>
        </Card>
        
        <Card className="punk-card text-center">
          <CardContent className="p-6">
            <Crown className="h-8 w-8 text-purple-500 mx-auto mb-4" />
            <h3 className="font-bold mb-2">Punk-Focused</h3>
            <p className="text-sm text-muted-foreground">
              Specialized for punk, rock, and alternative music analysis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Embedded Stripe Pricing Table */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-4">Choose Your Punk Power Level</h2>
          <p className="text-muted-foreground">
            From bedroom rebel to stage legend - pick the plan that matches your punk spirit
          </p>
        </div>
        
        <Card className="punk-card">
          <CardContent className="p-8">
            <div 
              dangerouslySetInnerHTML={{
                __html: `
                  <stripe-pricing-table 
                    pricing-table-id="prctbl_1RhI8UGWE0odGpiALkoUoq1g"
                    publishable-key="pk_live_51RhHm0GWE0odGpiANK5s7WRqEyJT35uU4JcY3YEued7GRU1g02miaYGnfrlQPWUE4dod85nW7MYj0dGyZaCj5ioj00BwdzZnqJ">
                  </stripe-pricing-table>
                `
              }}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SignUpPricingSection;