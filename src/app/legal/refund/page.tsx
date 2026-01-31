'use client';

import { Card } from '@/components/ui/card';

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
      
      <Card className="p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
          <p className="text-gray-700">
            Campus Market P2P operates as a peer-to-peer marketplace connecting student buyers and sellers. 
            This policy outlines the circumstances under which refunds may be issued and the process for requesting them.
          </p>
          <p className="text-gray-700 mt-4">
            <strong>Last Updated:</strong> January 31, 2025
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Escrow Protection</h2>
          <p className="text-gray-700 mb-4">
            For digital payments, we hold funds in escrow until the buyer confirms receipt and satisfaction. 
            This protects both buyers and sellers.
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Funds are held for up to 7 days after transaction initiation</li>
            <li>Buyers can confirm receipt early to release funds immediately</li>
            <li>If no action is taken within 7 days, funds automatically release to seller</li>
            <li>Disputes must be raised within the 7-day escrow period</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Refund Eligibility</h2>
          <p className="text-gray-700 mb-2">Refunds may be issued if:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Item Not as Described:</strong> Item significantly differs from listing description or photos</li>
            <li><strong>Item Not Received:</strong> Seller fails to deliver within agreed timeframe</li>
            <li><strong>Counterfeit/Fake:</strong> Item is proven to be fake or counterfeit</li>
            <li><strong>Damaged/Defective:</strong> Item arrives damaged (not disclosed) or is non-functional</li>
            <li><strong>Wrong Item:</strong> Seller sends a different item than listed</li>
            <li><strong>Seller Cancelled:</strong> Seller backs out after payment</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Situations</h2>
          <p className="text-gray-700 mb-2">Refunds will NOT be issued if:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Buyer's Remorse:</strong> Simply changing your mind after purchase</li>
            <li><strong>After Confirmation:</strong> Buyer already confirmed receipt and released funds</li>
            <li><strong>Cash Transactions:</strong> In-person cash payments (these bypass escrow)</li>
            <li><strong>After 7 Days:</strong> Dispute raised after escrow period ended</li>
            <li><strong>Cosmetic Issues:</strong> Minor wear/tear consistent with listed condition</li>
            <li><strong>Personal Disputes:</strong> Arguments unrelated to transaction terms</li>
            <li><strong>Incorrect Purchase:</strong> Buying wrong item, size, or color (read listings carefully)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Refund Process</h2>
          
          <h3 className="text-xl font-semibold mb-2">Step 1: Contact the Seller</h3>
          <p className="text-gray-700 mb-4">
            Attempt to resolve the issue directly with the seller through our messaging system. 
            Many issues can be resolved quickly through communication.
          </p>

          <h3 className="text-xl font-semibold mb-2">Step 2: Open a Dispute (If Unresolved)</h3>
          <p className="text-gray-700 mb-4">
            If the seller does not respond within 48 hours or refuses to resolve the issue:
          </p>
          <ul className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
            <li>Go to your transaction history</li>
            <li>Click "Report Issue" or "Open Dispute"</li>
            <li>Select the reason and provide detailed description</li>
            <li>Upload evidence (photos, screenshots, messages)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Step 3: Moderation Review</h3>
          <p className="text-gray-700 mb-4">Our moderation team will:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Review all evidence from both parties</li>
            <li>Request additional information if needed</li>
            <li>Verify transaction details and listing accuracy</li>
            <li>Make a binding decision within 5 business days</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Step 4: Resolution</h3>
          <p className="text-gray-700 mb-2">Possible outcomes:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Full Refund:</strong> All funds returned to buyer</li>
            <li><strong>Partial Refund:</strong> Compensation for partial issue (e.g., missing accessory)</li>
            <li><strong>No Refund:</strong> Seller's listing was accurate, claim denied</li>
            <li><strong>Split Resolution:</strong> Both parties share responsibility</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Evidence Requirements</h2>
          <p className="text-gray-700 mb-2">To support your refund claim, provide:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Clear photos of the received item showing issues</li>
            <li>Screenshots of the original listing</li>
            <li>Message history with seller</li>
            <li>Receipts or proof of payment</li>
            <li>Packaging photos (if claiming damage)</li>
            <li>Third-party verification (if claiming counterfeit)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Refund Timeline</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Dispute Review:</strong> 3-5 business days</li>
            <li><strong>Refund Processing:</strong> 1-3 business days after approval</li>
            <li><strong>Bank Transfer:</strong> 3-5 business days to see funds in account</li>
            <li><strong>Total:</strong> 7-13 business days from dispute opening to refund receipt</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Refund Methods</h2>
          <p className="text-gray-700 mb-4">
            Refunds are issued to the original payment method:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Bank Transfer:</strong> Direct deposit to your registered account</li>
            <li><strong>Debit/Credit Card:</strong> Refunded to the card used for payment</li>
            <li><strong>Campus Market Wallet:</strong> Instant credit for future purchases</li>
          </ul>
          <p className="text-gray-700 mt-4">
            <em>Note:</em> Cash transactions cannot be refunded through our system. 
            For in-person meetups, we recommend using our escrow system for protection.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Platform Fees</h2>
          <p className="text-gray-700">
            If a full refund is issued, the 2.5% platform fee paid by the seller will also be refunded. 
            Payment processor fees (typically 1.5%) are non-refundable as they've already been charged by third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Seller Protection</h2>
          <p className="text-gray-700 mb-4">
            Sellers are protected against fraudulent refund claims. We verify:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Listing accuracy matched the delivered item</li>
            <li>Buyer received the correct item as described</li>
            <li>Condition was accurately disclosed</li>
            <li>Delivery confirmation (if applicable)</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Buyers attempting fraudulent refunds may face account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Partial Refunds</h2>
          <p className="text-gray-700 mb-2">
            Partial refunds may be offered when:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Minor defect or missing accessory (not deal-breaking)</li>
            <li>Item is slightly different from description but still usable</li>
            <li>Both parties agree to a partial resolution</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Partial refund amounts are determined by our moderation team based on fair market value adjustment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Repeat Offenders</h2>
          <p className="text-gray-700">
            Users with multiple justified refund claims (buyers or sellers) may face:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
            <li>Account review and warnings</li>
            <li>Temporary selling/buying restrictions</li>
            <li>Permanent ban for fraudulent activity</li>
          </ul>
          <p className="text-gray-700">
            We track patterns to identify problematic users and protect the community.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Appeal Process</h2>
          <p className="text-gray-700 mb-4">
            If you disagree with a refund decision:
          </p>
          <ul className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>Submit an appeal within 7 days of the decision</li>
            <li>Provide new evidence not previously considered</li>
            <li>A senior moderator will conduct a final review</li>
            <li>Final decision is binding and cannot be appealed again</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <p className="text-gray-700">
            For refund inquiries or assistance:
          </p>
          <p className="text-gray-700 mt-2">
            Email: refunds@campusmarketp2p.com.ng<br />
            Phone: +234 XXX XXX XXXX<br />
            Support Hours: Monday-Friday, 9am-6pm WAT
          </p>
        </section>

        <div className="pt-6 border-t">
          <p className="text-sm text-gray-500">
            This refund policy is designed to be fair to both buyers and sellers. 
            By using Campus Market P2P, you agree to these refund terms.
          </p>
        </div>
      </Card>
    </div>
  );
}
