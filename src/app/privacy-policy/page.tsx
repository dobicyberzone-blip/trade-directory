import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 pt-28 sm:pt-32 lg:pt-36">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-4">Privacy Policy</h1>
          <p className="text-base text-muted-foreground mb-10 pb-6 border-b border-border">
            <strong>Last updated:</strong> January 2026
          </p>
          <div className="prose lg:prose-xl max-w-none text-foreground space-y-8">
            
            <section>
              <p>
                The Kenya Export Promotion and Branding Agency (KEPROBA) is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Trade Directory platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6">Personal Information</h3>
              <p>When you register on our platform, we may collect:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Name, email address, and contact information</li>
                <li>Business information including company name, address, and industry</li>
                <li>Professional details such as job title and business description</li>
                <li>Account credentials and authentication information</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">Business Information</h3>
              <p>For verified exporters, we collect:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Business registration details and licenses</li>
                <li>Product catalogs and service descriptions</li>
                <li>Certifications and quality standards</li>
                <li>Export history and trade statistics</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">Technical Information</h3>
              <p>We automatically collect:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>IP addresses and device information</li>
                <li>Browser type and operating system</li>
                <li>Usage patterns and navigation data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Provide and maintain our trade directory services</li>
                <li>Verify business credentials and maintain platform integrity</li>
                <li>Facilitate connections between exporters and buyers</li>
                <li>Send important updates about your account and our services</li>
                <li>Improve our platform based on usage analytics</li>
                <li>Comply with legal obligations and government regulations</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Information Sharing</h2>
              <p>We may share your information with:</p>
              
              <h3 className="text-xl font-medium text-foreground mt-6">Public Directory</h3>
              <p>Verified business information is displayed publicly to promote Kenyan exports, including:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Company name, description, and contact details</li>
                <li>Product and service offerings</li>
                <li>Certifications and quality standards</li>
                <li>Business location and industry sector</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">Government Agencies</h3>
              <p>As a state corporation, we may share information with relevant government bodies for:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Trade promotion and export development</li>
                <li>Regulatory compliance and reporting</li>
                <li>National economic planning and statistics</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6">Service Providers</h3>
              <p>We work with trusted third parties who help us operate our platform, including:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Cloud hosting and data storage providers</li>
                <li>Payment processing services</li>
                <li>Email and communication services</li>
                <li>Analytics and performance monitoring tools</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Data Security</h2>
              <p>We implement appropriate security measures to protect your information:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication systems</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response procedures for security breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request data portability where applicable</li>
                <li>Lodge complaints with relevant data protection authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Remember your login preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and recommendations</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
              <p>You can control cookie settings through your browser preferences.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">International Transfers</h2>
              <p>
                As we promote Kenyan exports globally, your information may be transferred to and processed in countries outside Kenya. We ensure appropriate safeguards are in place to protect your data during international transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Data Retention</h2>
              <p>
                We retain your information for as long as necessary to provide our services and comply with legal obligations. Business directory information may be retained longer to maintain historical trade records and support export promotion activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes through email or platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground">Contact Us</h2>
              <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
                <p>1st and 16th Floor Anniversary Towers, University Way</p>
                <p>P.O. Box 40247 00100 GPO, Nairobi, Kenya</p>
                <p>Email: privacy@keproba.go.ke</p>
                <p>Phone: +254 20 222 85 34 8</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
