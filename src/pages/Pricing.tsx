import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Check, Zap, Crown, Star } from 'lucide-react';
import FooterNavigation from '@/components/FooterNavigation';

// Add Stripe script to document head
const addStripeScript = () => {
  if (!document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.head.appendChild(script);
  }
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();

  useEffect(() => {
    addStripeScript();
  }, []);

  const plans = [
    {
      id: 'free_rebel',
      name: 'Free Rebel',
      price: '$0',
      period: '/month',
      description: 'Start your punk journey',
      icon: <Zap className="h-6 w-6" />,
      features: [
        '5 audio analyses per month',
        'Basic chord recognition',
        'Simple tempo detection',
        'Basic difficulty assessment',
        'Community support'
      ],
      limitations: [
        'No interactive player',
        'No practice mode',
        'No tabs generation',
        'No chord diagrams'
      ],
      current: subscription?.subscription_tier === 'free_rebel'
    },
    {
      id: 'punk_starter',
      name: 'Punk Starter',
      price: '$7.99',
      period: '/month',
      description: 'Level up your analysis',
      icon: <Star className="h-6 w-6" />,
      features: [
        '25 audio analyses per month',
        'Interactive audio player',
        'Real-time chord recognition',
        'Chord diagrams',
        'Basic practice mode',
        'YouTube integration',
        'Basic tabs generation',
        'Email support'
      ],
      popular: true,
      current: subscription?.subscription_tier === 'punk_starter'
    },
    {
      id: 'riot_rocker',
      name: 'Riot Rocker',
      price: '$19.99',
      period: '/month',
      description: 'Professional punk analysis',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '100 audio analyses per month',
        'Advanced practice mode',
        'Multi-instrument tabs',
        'PDF chord chart export',
        'Enhanced audio processing',
        'Priority support',
        'Advanced difficulty analysis',
        'Song structure analysis'
      ],
      current: subscription?.subscription_tier === 'riot_rocker'
    },
    {
      id: 'punk_legend',
      name: 'Punk Legend',
      price: '$39.99',
      period: '/month',
      description: 'Ultimate punk mastery',
      icon: <Crown className="h-6 w-6 text-yellow-500" />,
      features: [
        'Unlimited audio analyses',
        'MIDI export functionality',
        'AI-powered practice tutor',
        'Real-time chord tracking',
        'Advanced tabs with fingerings',
        'Custom chord progressions',
        'Priority phone support',
        'Early access to new features'
      ],
      premium: true,
      current: subscription?.subscription_tier === 'punk_legend'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to RIOT SHEETS
          </Button>
          
          {!user && (
            <Button onClick={() => navigate('/auth')} className="punk-button">
              Sign Up
            </Button>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            🎸 Choose Your Punk Power
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From bedroom rebel to stage legend - pick the plan that matches your punk spirit
          </p>
        </div>

        {/* Current Plan Status */}
        {user && subscription && (
          <div className="text-center mb-8">
            <Card className="inline-block punk-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-bold">{plans.find(p => p.id === subscription.subscription_tier)?.name || 'Unknown'}</p>
                <p className="text-sm">
                  {subscription.monthly_analyses_used}/{subscription.monthly_analyses_limit} analyses used this month
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`punk-card relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              } ${
                plan.current ? 'border-green-500' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              {plan.current && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {plan.limitations && (
                  <div className="space-y-2 pt-4 border-t border-muted">
                    <p className="text-xs font-medium text-muted-foreground">Not included:</p>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="h-4 w-4 text-muted-foreground">×</span>
                        <span className="text-xs text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stripe Pricing Table */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Ready to Upgrade?</h2>
          <div className="punk-card p-8">
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
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="punk-card p-6">
              <h3 className="font-bold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">
                Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="punk-card p-6">
              <h3 className="font-bold mb-2">What happens if I exceed my monthly limit?</h3>
              <p className="text-muted-foreground">
                You'll be prompted to upgrade to continue analyzing. Your existing analyses remain accessible.
              </p>
            </div>
            <div className="punk-card p-6">
              <h3 className="font-bold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                The Free Rebel plan gives you 5 analyses per month to try our core features at no cost!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FooterNavigation />
    </div>
  );
};

export default Pricing;