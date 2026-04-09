import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import FooterNavigation from '@/components/FooterNavigation';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to RIOT SHEETS
        </Button>

        <div className="punk-card p-8">
          <h1 className="text-3xl font-bold gradient-text mb-8">Terms of Service</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using RIOT SHEETS, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Service Description</h2>
              <p>RIOT SHEETS is an AI-powered music analysis platform that provides chord recognition, tempo detection, and practice tools for musicians.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Subscription Terms</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Subscriptions are billed monthly and renew automatically</li>
                <li>You may cancel your subscription at any time through your account settings</li>
                <li>Refunds are provided in accordance with our refund policy</li>
                <li>Usage limits apply to each subscription tier as specified</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Acceptable Use</h2>
              <p>You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
              <p>The service and its original content remain the property of RIOT SHEETS. You retain ownership of any content you upload.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Privacy</h2>
              <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
              <p>RIOT SHEETS shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Information</h2>
              <p>For questions about these Terms of Service, please contact us at support@riotsheets.com</p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-muted">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      <FooterNavigation />
    </div>
  );
};

export default Terms;