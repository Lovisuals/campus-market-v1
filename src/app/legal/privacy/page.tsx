'use client';

import { Card } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <Card className="p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Campus Market P2P ("we", "us", "our") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our platform.
          </p>
          <p className="text-gray-700">
            <strong>Effective Date:</strong> January 31, 2025
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Account Information:</strong> Full name, email address, phone number, campus/university</li>
            <li><strong>Verification Data:</strong> Student ID, profile photo (optional)</li>
            <li><strong>Transaction Information:</strong> Purchase history, listings, messages, reviews</li>
            <li><strong>Payment Information:</strong> Payment method details (processed by third-party providers)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
            <li><strong>IP Address:</strong> For security, fraud prevention, and location verification</li>
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, search queries</li>
            <li><strong>Cookies:</strong> Session management, preferences, analytics</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.3 User-Generated Content</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Listing descriptions and photos</li>
            <li>Messages and communications</li>
            <li>Reviews and ratings</li>
            <li>Profile information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Provide Services:</strong> Account management, listings, transactions, messaging</li>
            <li><strong>Security:</strong> Fraud detection, abuse prevention, account verification</li>
            <li><strong>Communications:</strong> Transaction notifications, platform updates, customer support</li>
            <li><strong>Improvements:</strong> Analyze usage patterns, enhance features, fix bugs</li>
            <li><strong>Legal Compliance:</strong> Comply with Nigerian laws, respond to legal requests</li>
            <li><strong>Marketing:</strong> Send promotional emails (you can opt out)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-semibold mb-2">4.1 With Other Users</h3>
          <p className="text-gray-700 mb-4">
            Your public profile (name, campus, ratings) is visible to other users. 
            During transactions, we share your name and contact method with the other party.
          </p>

          <h3 className="text-xl font-semibold mb-2">4.2 With Service Providers</h3>
          <p className="text-gray-700 mb-4">We share data with trusted third parties:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li><strong>Payment Processors:</strong> Paystack, Flutterwave (for payment processing)</li>
            <li><strong>Cloud Hosting:</strong> Supabase, Vercel (for infrastructure)</li>
            <li><strong>Email Service:</strong> Resend (for transactional emails)</li>
            <li><strong>Analytics:</strong> Sentry (for error monitoring)</li>
            <li><strong>SMS Provider:</strong> For OTP delivery</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">4.3 Legal Requirements</h3>
          <p className="text-gray-700">
            We may disclose your information if required by law, court order, or government request, 
            or to protect our rights, safety, or property.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="text-gray-700 mb-2">We implement security measures including:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>End-to-end encryption for messages</li>
            <li>Secure HTTPS connections</li>
            <li>Password hashing and salting</li>
            <li>Regular security audits</li>
            <li>IP address hashing for device tracking</li>
            <li>Rate limiting and DDoS protection</li>
          </ul>
          <p className="text-gray-700 mt-4">
            However, no system is 100% secure. You are responsible for keeping your password confidential.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
          <p className="text-gray-700 mb-2">We retain your data:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Active Accounts:</strong> As long as your account is active</li>
            <li><strong>Deleted Accounts:</strong> Up to 90 days for recovery and legal compliance</li>
            <li><strong>Transaction Records:</strong> 7 years for tax and legal requirements</li>
            <li><strong>Audit Logs:</strong> 2 years for security and fraud prevention</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-gray-700 mb-2">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request account and data deletion</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Object:</strong> Object to processing of your data</li>
          </ul>
          <p className="text-gray-700 mt-4">
            To exercise these rights, contact us at privacy@campusmarketp2p.com.ng
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
          <p className="text-gray-700 mb-2">We use cookies for:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Essential:</strong> Authentication, security, session management</li>
            <li><strong>Functional:</strong> Preferences, language settings</li>
            <li><strong>Analytics:</strong> Usage statistics, performance monitoring</li>
          </ul>
          <p className="text-gray-700 mt-4">
            You can control cookies through your browser settings, but some features may not work properly if disabled.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Third-Party Links</h2>
          <p className="text-gray-700">
            Our platform may contain links to external websites. We are not responsible for the privacy 
            practices of these sites. Please review their privacy policies before sharing information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
          <p className="text-gray-700">
            Our service is intended for users 18 years and older. We do not knowingly collect data from 
            children under 18 without parental consent. If you believe we have collected such data, 
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
          <p className="text-gray-700">
            Your data is primarily stored in Nigeria and the European Union (Supabase servers). 
            By using our service, you consent to international data transfers as necessary for our operations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy periodically. We will notify you of significant changes 
            via email or platform notification. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Data Breach Notification</h2>
          <p className="text-gray-700">
            In the event of a data breach affecting your personal information, we will notify you 
            within 72 hours and provide details about the breach and steps taken to address it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
          <p className="text-gray-700 mb-2">
            For privacy-related questions or requests:
          </p>
          <p className="text-gray-700">
            <strong>Data Protection Officer</strong><br />
            Email: privacy@campusmarketp2p.com.ng<br />
            Address: [University Address], Nigeria
          </p>
        </section>

        <div className="pt-6 border-t">
          <p className="text-sm text-gray-500">
            This privacy policy complies with the Nigeria Data Protection Regulation (NDPR) 2019 
            and international best practices.
          </p>
        </div>
      </Card>
    </div>
  );
}
