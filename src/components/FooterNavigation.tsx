import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, CreditCard, Crown, FileText, Shield, Music } from 'lucide-react';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';

const FooterNavigation = () => {
  const navigate = useNavigate();
  const { user, session, subscription, signOut } = useAuth();
  const { handleManageSubscription, getTierDisplay } = useSubscriptionManagement(user, session, subscription);

  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Main Navigation Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold gradient-text"
            >
              🎸 RIOT SHEETS
            </button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <Music className="h-4 w-4 mr-2" />
              App
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pricing
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/terms')}>
              <FileText className="h-4 w-4 mr-2" />
              Terms
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/privacy')}>
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </Button>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="flex gap-2">
                <Button onClick={() => navigate('/auth')} className="punk-button">
                  Sign Up / Login
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Usage Display */}
                {subscription && (
                  <div className="text-sm text-muted-foreground">
                    {subscription.monthly_analyses_used}/{subscription.monthly_analyses_limit} analyses used
                  </div>
                )}

                {/* Subscription Tier Badge */}
                {subscription && (
                  <Badge 
                    className={`${getTierDisplay(subscription.subscription_tier).color} text-white`}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    {getTierDisplay(subscription.subscription_tier).name}
                  </Badge>
                )}

                {/* Manage Subscription */}
                <Button variant="ghost" size="sm" onClick={handleManageSubscription}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {subscription?.subscribed ? 'Manage' : 'Upgrade'}
                </Button>

                {/* User Info & Logout */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-muted-foreground">
            RIOT SHEETS - Where Punk Meets Precision ⚡
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterNavigation;