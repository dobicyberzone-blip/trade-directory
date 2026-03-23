import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 sm:pt-32 lg:pt-36">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-4">Terms &amp; Conditions</h1>
          <p className="text-base text-muted-foreground mb-10 pb-6 border-b border-border">
            <strong>Last updated:</strong> January 2026
          </p>
          <div className="prose lg:prose-xl max-w-none text-foreground space-y-8">
            
            <section>
              <p>
                Welcome to the Kenya Export Promotion and Branding Agency (KEPROBA) Trade Directory. These Terms and Conditions govern your use of our platform and services. By accessing or using our platform, you agree to be bound by these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using the KEPROBA Trade Directory platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">2. Platform Purpose</h2>
              <p>The KEPROBA Trade Directory is designed to:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Connect verified Kenyan exporters with international buyers</li>
                <li>Promote Kenyan products and services in global markets</li>
                <li>Facilitate trade relationships and business partnerships</li>
                <li>Provide market intelligence and trade information</li>
                <li>Support Kenya's export development objectives</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">3.1 Account Creation</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>One person or entity may maintain only one account</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">3.2 Verification Process</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Exporters must undergo KEPROBA's verification process</li>
                <li>Verification requires submission of valid business documentation</li>
                <li>KEPROBA reserves the right to approve or reject verification applications</li>
                <li>Verified status may be revoked if information is found to be false or misleading</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">4. User Responsibilities</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">4.1 Content Accuracy</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>All information provided must be accurate, current, and complete</li>
                <li>Business information must reflect actual capabilities and offerings</li>
                <li>Product descriptions must be truthful and not misleading</li>
                <li>Contact information must be valid and regularly monitored</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">4.2 Professional Conduct</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Maintain professional standards in all communications</li>
                <li>Respond promptly to legitimate business inquiries</li>
                <li>Honor commitments made through the platform</li>
                <li>Respect intellectual property rights of others</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">4.3 Prohibited Activities</h3>
              <p>Users must not:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Post false, misleading, or fraudulent information</li>
                <li>Engage in spam, harassment, or abusive behavior</li>
                <li>Attempt to circumvent platform security measures</li>
                <li>Use the platform for illegal activities</li>
                <li>Infringe on intellectual property rights</li>
                <li>Share login credentials with unauthorized parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">5. Business Transactions</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">5.1 Platform Role</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>KEPROBA facilitates connections but is not party to business transactions</li>
                <li>All commercial agreements are between buyers and exporters directly</li>
                <li>KEPROBA does not guarantee the completion or success of any transaction</li>
                <li>Users are responsible for conducting their own due diligence</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">5.2 Dispute Resolution</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Commercial disputes should be resolved directly between parties</li>
                <li>KEPROBA may provide mediation assistance upon request</li>
                <li>Users should follow applicable trade laws and regulations</li>
                <li>International trade disputes may be subject to arbitration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">6. Intellectual Property</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">6.1 Platform Content</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>KEPROBA owns all platform software, design, and functionality</li>
                <li>Users may not copy, modify, or distribute platform code</li>
                <li>KEPROBA trademarks and logos are protected intellectual property</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">6.2 User Content</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Users retain ownership of their business content and data</li>
                <li>Users grant KEPROBA license to display and promote their content</li>
                <li>Users must have rights to all content they upload</li>
                <li>KEPROBA may use aggregated data for research and promotion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">7. Data Protection and Privacy</h2>
              <ul className="space-y-2 list-disc pl-6">
                <li>Personal data is processed according to our Privacy Policy</li>
                <li>Business information may be displayed publicly for trade promotion</li>
                <li>Users consent to data sharing with relevant government agencies</li>
                <li>International data transfers may occur to facilitate global trade</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">8. Platform Availability and Modifications</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">8.1 Service Availability</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>We strive to maintain platform availability but cannot guarantee 100% uptime</li>
                <li>Scheduled maintenance will be announced in advance when possible</li>
                <li>Emergency maintenance may occur without prior notice</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">8.2 Platform Changes</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>KEPROBA may modify platform features and functionality</li>
                <li>Significant changes will be communicated to users</li>
                <li>Continued use constitutes acceptance of modifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
              <ul className="space-y-2 list-disc pl-6">
                <li>KEPROBA provides the platform "as is" without warranties</li>
                <li>We are not liable for business losses or failed transactions</li>
                <li>Users assume responsibility for their business decisions</li>
                <li>Our liability is limited to the maximum extent permitted by law</li>
                <li>We are not responsible for third-party content or actions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">10. Account Termination</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">10.1 User Termination</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>Users may close their accounts at any time</li>
                <li>Account closure does not affect existing business relationships</li>
                <li>Some data may be retained for legal and regulatory purposes</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">10.2 KEPROBA Termination</h3>
              <ul className="space-y-2 list-disc pl-6">
                <li>We may suspend or terminate accounts for terms violations</li>
                <li>Termination may occur immediately for serious violations</li>
                <li>Users will be notified of termination reasons when possible</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
              <p>
                These Terms and Conditions are governed by the laws of Kenya. Any disputes arising from these terms or platform use shall be subject to the jurisdiction of Kenyan courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
              <p>
                KEPROBA may update these Terms and Conditions periodically. Users will be notified of significant changes through email or platform notifications. Continued use of the platform constitutes acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">13. Contact Information</h2>
              <p>For questions about these Terms and Conditions, please contact us:</p>
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
                <p>1st and 16th Floor Anniversary Towers, University Way</p>
                <p>P.O. Box 40247 00100 GPO, Nairobi, Kenya</p>
                <p>Email: legal@keproba.go.ke</p>
                <p>Phone: +254 20 222 85 34 8</p>
              </div>
            </section>

            <section className="border-t pt-8">
              <p className="text-sm text-muted-foreground">
                By using the KEPROBA Trade Directory, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
