import { functions } from '@/lib/api';

interface Subscription {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  monthly_analyses_used: number;
  monthly_analyses_limit: number;
}

interface User {
  id: string;
  email: string;
}

interface UseSubscriptionManagementResult {
  handleManageSubscription: () => Promise<void>;
  getTierDisplay: (tier: string) => { name: string; color: string };
  monthly_analyses_used: number;
  monthly_analyses_limit: number;
  usagePercentage: number;
}

export const useSubscriptionManagement = (
  user: User | null,
  session: { access_token: string } | null,
  subscription: Subscription | null
): UseSubscriptionManagementResult => {

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await functions.invoke('customer-portal');

      if (error) {
        console.error('Error opening customer portal:', error);
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  const getTierDisplay = (tier: string) => {
    switch (tier) {
      case 'free_rebel': return { name: 'Free Rebel', color: 'bg-gray-500' };
      case 'punk_starter': return { name: 'Punk Starter', color: 'bg-blue-500' };
      case 'riot_rocker': return { name: 'Riot Rocker', color: 'bg-purple-500' };
      case 'punk_legend': return { name: 'Punk Legend', color: 'bg-yellow-500' };
      default: return { name: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const monthly_analyses_used = subscription?.monthly_analyses_used || 0;
  const monthly_analyses_limit = subscription?.monthly_analyses_limit || 0;
  const usagePercentage = monthly_analyses_limit > 0 ? (monthly_analyses_used / monthly_analyses_limit) * 100 : 0;

  return {
    handleManageSubscription,
    getTierDisplay,
    monthly_analyses_used,
    monthly_analyses_limit,
    usagePercentage: Math.min(usagePercentage, 100),
  };
};
