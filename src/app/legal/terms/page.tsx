'use client';

import { Card } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <Card className="p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using Campus Market P2P ("the Platform"), you accept and agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>
          <p className="text-gray-700">
            Last Updated: January 31, 2025
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
          <p className="text-gray-700 mb-2">You must:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Be at least 18 years old or have parental consent</li>
            <li>Be a current student or staff member of a registered Nigerian university</li>
            <li>Provide accurate and truthful information during registration</li>
            <li>Maintain the security of your account credentials</li>
            <li>Have a valid Nigerian phone number and email address</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Account Responsibilities</h2>
          <p className="text-gray-700 mb-2">As a user, you agree to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Not share your account with others</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Not create multiple accounts to circumvent restrictions</li>
            <li>Keep your contact information up to date</li>
            <li>Not impersonate others or provide false information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Prohibited Items and Activities</h2>
          <p className="text-gray-700 mb-2">You may NOT list or sell:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Stolen, counterfeit, or illegal items</li>
            <li>Weapons, explosives, or dangerous materials</li>
            <li>Drugs, alcohol, or tobacco products</li>
            <li>Adult content or services</li>
            <li>Academic fraud services (essay writing, exam cheating)</li>
            <li>Pyramid schemes, MLM, or get-rich-quick schemes</li>
            <li>Unauthorized software or digital goods</li>
          </ul>
          <p className="text-gray-700 mt-4">
            You may NOT engage in:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
            <li>Fraud, scams, or misleading descriptions</li>
            <li>Harassment, threats, or hate speech</li>
            <li>Spam or unsolicited advertising</li>
            <li>Price manipulation or artificial bidding</li>
            <li>Attempting to circumvent our fees or escrow system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Listing Requirements</h2>
          <p className="text-gray-700 mb-2">All listings must:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Have accurate descriptions and real photos of the actual item</li>
            <li>Include honest condition assessments</li>
            <li>Have fair and reasonable pricing</li>
            <li>Be categorized correctly</li>
            <li>Comply with Nigerian laws and university policies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Transaction Process</h2>
          <h3 className="text-xl font-semibold mb-2">6.1 Escrow Protection</h3>
          <p className="text-gray-700 mb-4">
            For digital payments, funds are held in escrow until the buyer confirms receipt. 
            Buyers have 7 days to confirm or dispute. After 7 days, funds are automatically released to the seller.
          </p>

          <h3 className="text-xl font-semibold mb-2">6.2 Meeting Safety</h3>
          <p className="text-gray-700 mb-4">
            For in-person transactions, always meet in public campus locations during daylight hours. 
            We recommend meeting at campus security posts or busy common areas.
          </p>

          <h3 className="text-xl font-semibold mb-2">6.3 Transaction Fees</h3>
          <p className="text-gray-700">
            Platform fees are 2.5% for sellers on completed transactions. Buyers pay no fees. 
            Payment processor fees may apply for digital payments.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Dispute Resolution</h2>
          <p className="text-gray-700 mb-4">
            If a dispute arises, both parties must attempt to resolve it directly first. 
            If unresolved within 48 hours, you may escalate to our moderation team.
          </p>
          <p className="text-gray-700 mb-2">Our moderation team will:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Review evidence from both parties</li>
            <li>Request additional information if needed</li>
            <li>Make a binding decision within 5 business days</li>
            <li>Release or refund escrow funds based on the decision</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. User Conduct and Penalties</h2>
          <p className="text-gray-700 mb-2">Violations may result in:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Warning:</strong> First minor offense</li>
            <li><strong>Listing Removal:</strong> Prohibited or misleading content</li>
            <li><strong>Temporary Ban:</strong> Repeated violations (7-30 days)</li>
            <li><strong>Permanent Ban:</strong> Serious violations, fraud, or 3+ strikes</li>
            <li><strong>Legal Action:</strong> Criminal activity will be reported to authorities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Liability and Disclaimers</h2>
          <p className="text-gray-700 mb-4">
            Campus Market P2P is a platform connecting buyers and sellers. We are NOT a party to transactions 
            and are not responsible for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Quality, safety, legality, or accuracy of listed items</li>
            <li>Ability of sellers to complete transactions</li>
            <li>Ability of buyers to pay</li>
            <li>Disputes between users</li>
            <li>Lost, damaged, or stolen items during meetups</li>
          </ul>
          <p className="text-gray-700 mt-4">
            <strong>USE AT YOUR OWN RISK.</strong> We provide tools and escrow protection, 
            but cannot guarantee transaction outcomes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            By posting content (photos, descriptions, reviews), you grant Campus Market P2P 
            a non-exclusive license to use, display, and distribute that content on the platform.
          </p>
          <p className="text-gray-700">
            You retain ownership of your content and can delete it at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Privacy and Data</h2>
          <p className="text-gray-700">
            Your use of the platform is also governed by our{' '}
            <a href="/legal/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            . We collect and use data as described in that policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Modifications to Service</h2>
          <p className="text-gray-700">
            We reserve the right to modify, suspend, or discontinue any part of the service 
            at any time without notice. We will notify users of significant changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
          <p className="text-gray-700">
            You may delete your account at any time. We may suspend or terminate accounts 
            that violate these terms. Upon termination, you lose access to your account 
            and any pending transactions may be cancelled.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
          <p className="text-gray-700">
            These terms are governed by the laws of the Federal Republic of Nigeria. 
            Disputes will be resolved in Nigerian courts.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
          <p className="text-gray-700">
            For questions about these terms, contact us at:
          </p>
          <p className="text-gray-700 mt-2">
            Email: legal@campusmarketp2p.com.ng<br />
            Phone: +234 XXX XXX XXXX
          </p>
        </section>

        <div className="pt-6 border-t">
          <p className="text-sm text-gray-500">
            By using Campus Market P2P, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms of Service.
          </p>
        </div>
      </Card>
    </div>
  );
}
