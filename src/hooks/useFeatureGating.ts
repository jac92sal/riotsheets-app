import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FeatureAccess {
  hasAccess: boolean;
  requiresUpgrade: boolean;
  currentTier: string;
  requiredTier: string;
}

export const useFeatureGating = () => {
  const { subscription } = useAuth();
  const { toast } = useToast();

  const checkFeatureAccess = (requiredTier: string): FeatureAccess => {
    if (!subscription) {
      return {
        hasAccess: false,
        requiresUpgrade: true,
        currentTier: 'none',
        requiredTier,
      };
    }

    const tierHierarchy = {
      'free_rebel': 0,
      'punk_starter': 1,
      'riot_rocker': 2,
      'punk_legend': 3,
    };

    const currentLevel = tierHierarchy[subscription.subscription_tier as keyof typeof tierHierarchy] || 0;
    const requiredLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;

    const hasAccess = currentLevel >= requiredLevel;

    return {
      hasAccess,
      requiresUpgrade: !hasAccess,
      currentTier: subscription.subscription_tier,
      requiredTier,
    };
  };

  const checkUsageLimit = (): boolean => {
    if (!subscription) return false;
    
    if (subscription.subscribed) return true; // Paid users can always analyze
    
    return subscription.monthly_analyses_used < subscription.monthly_analyses_limit;
  };

  const showUpgradePrompt = (featureName: string, requiredTier: string) => {
    const tierNames = {
      'punk_starter': 'Punk Starter ($7.99/month)',
      'riot_rocker': 'Riot Rocker ($19.99/month)',
      'punk_legend': 'Punk Legend ($39.99/month)',
    };

    toast({
      title: `${featureName} requires upgrade`,
      description: `This feature is available in ${tierNames[requiredTier as keyof typeof tierNames] || requiredTier}`,
      variant: 'destructive',
    });
  };

  const showUsageLimitPrompt = () => {
    toast({
      title: 'Monthly limit reached',
      description: 'You\'ve used all your free analyses this month. Upgrade to continue!',
      variant: 'destructive',
    });
  };

  // Feature checks
  const canUseInteractivePlayer = () => checkFeatureAccess('punk_starter').hasAccess;
  const canUsePracticeMode = () => checkFeatureAccess('punk_starter').hasAccess;
  const canGenerateTabs = () => checkFeatureAccess('punk_starter').hasAccess;
  const canUseAdvancedTabs = () => checkFeatureAccess('riot_rocker').hasAccess;
  const canExportPDF = () => checkFeatureAccess('riot_rocker').hasAccess;
  const canExportMIDI = () => checkFeatureAccess('punk_legend').hasAccess;
  const canUseAITutor = () => checkFeatureAccess('punk_legend').hasAccess;
  const canUseRealTimeAnalysis = () => checkFeatureAccess('punk_legend').hasAccess;

  return {
    checkFeatureAccess,
    checkUsageLimit,
    showUpgradePrompt,
    showUsageLimitPrompt,
    canUseInteractivePlayer,
    canUsePracticeMode,
    canGenerateTabs,
    canUseAdvancedTabs,
    canExportPDF,
    canExportMIDI,
    canUseAITutor,
    canUseRealTimeAnalysis,
    subscription,
  };
};