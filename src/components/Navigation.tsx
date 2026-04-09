import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, CreditCard, Crown } from 'lucide-react';
import { useSubscriptionManagement } from "@/hooks/useSubscriptionManagement";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, session, subscription, signOut } = useAuth();
  const { handleManageSubscription, getTierDisplay } = useSubscriptionManagement(user, session, subscription);

  return (
    <nav className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm border-b">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-bold gradient-text"
        >
          🎸 RIOT SHEETS
        </button>
      </div>

      <div className="flex items-center gap-4">
        {!user ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              Pricing
            </Button>
            <Button onClick={() => navigate('/auth')} className="punk-button">
              Sign Up
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Usage Display */}
            {subscription && (
              <div className="text-sm text-muted-foreground hidden sm:block">
                {subscription.monthly_analyses_used}/{subscription.monthly_analyses_limit} analyses
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

            {/* Pricing Link */}
            <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
              <CreditCard className="h-4 w-4 mr-2" />
              {subscription?.subscribed ? 'Manage' : 'Upgrade'}
            </Button>

            {/* User Menu */}
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
    </nav>
  );
};

export default Navigation;