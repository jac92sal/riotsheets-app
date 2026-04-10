import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';
import { MusicAnalysisHistory } from '@/components/MusicAnalysisHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Mic, CreditCard, BarChart3, Settings, LogOut } from 'lucide-react';
import Navigation from '@/components/Navigation';
import punkHeroBg from '@/assets/punk-hero-bg.jpg';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, session, subscription, signOut, loading } = useAuth();
  const { handleManageSubscription, getTierDisplay, monthly_analyses_used, monthly_analyses_limit, usagePercentage } = useSubscriptionManagement(user, session, subscription);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const tierInfo = getTierDisplay(subscription?.subscription_tier || 'free_rebel');

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 10, 0.85), rgba(26, 26, 26, 0.95)), url(${punkHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Navigation />

      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* Welcome Header */}
        <div className="text-center pt-6 pb-2">
          <h1 className="text-3xl font-black text-white tracking-tight">YOUR DASHBOARD</h1>
          <p className="text-gray-400 mt-1">{user.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Subscription Tier */}
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Crown className="h-6 w-6 mx-auto mb-2 text-pink-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wider">Plan</p>
              <p className={`text-lg font-black ${tierInfo.color.replace('bg-', 'text-').replace('500', '400')}`}>
                {tierInfo.name}
              </p>
            </CardContent>
          </Card>

          {/* Usage */}
          <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="text-xs text-gray-400 uppercase tracking-wider">Usage</p>
              <p className="text-lg font-black text-white">
                {monthly_analyses_used} / {monthly_analyses_limit}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/')}
            className="h-14 bg-pink-600 hover:bg-pink-500 text-white font-bold text-base"
          >
            <Mic className="h-5 w-5 mr-2" />
            RECORD
          </Button>
          <Button
            onClick={() => navigate('/pricing')}
            variant="outline"
            className="h-14 border-gray-600 text-white hover:bg-gray-800 font-bold text-base"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {subscription?.subscribed ? 'MANAGE PLAN' : 'UPGRADE'}
          </Button>
        </div>

        {/* Account Info */}
        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Email</span>
              <span className="text-white font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Subscription</span>
              <span className="text-white font-medium">{tierInfo.name}</span>
            </div>
            {subscription?.subscription_end && (
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Renews</span>
                <span className="text-white font-medium">
                  {new Date(subscription.subscription_end).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {subscription?.subscribed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Manage Billing
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis History */}
        <Card className="bg-gray-900/80 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Transcription History</CardTitle>
          </CardHeader>
          <CardContent>
            <MusicAnalysisHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
