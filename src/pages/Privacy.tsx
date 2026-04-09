import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import FooterNavigation from '@/components/FooterNavigation';

const Privacy = () => {
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
          <h1 className="text-3xl font-bold gradient-text mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Account information (email address, display name)</li>
                <li>Audio files you upload for analysis</li>
                <li>Usage data and analytics</li>
                <li>Payment information (processed by Stripe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide and improve our music analysis services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important service updates and notifications</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Storage and Security</h2>
              <p>Your data is stored securely using industry-standard encryption. Audio files are processed for analysis and may be temporarily stored to improve our AI models.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Services</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Stripe for payment processing</li>
                <li>Supabase for data storage and authentication</li>
                <li>Various AI services for music analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share data with service providers necessary to operate our platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. You may delete your account at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
              <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at privacy@riotsheets.com</p>
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

export default Privacy;