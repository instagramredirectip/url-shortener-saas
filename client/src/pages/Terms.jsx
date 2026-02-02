import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-600">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <FileText className="text-green-500" /> Terms of Service
          </h1>
          <p className="text-slate-400">Last Updated: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 leading-relaxed">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using <b>PandaLime</b> (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Allowable Content</h2>
          <p className="mb-4">You agree NOT to use PandaLime to shorten URLs that link to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Phishing, malware, or viruses.</li>
            <li>Explicit adult content, violence, or hate speech.</li>
            <li>Illegal drugs, weapons, or contraband.</li>
            <li>Government websites (to prevent impersonation scams).</li>
          </ul>
          <p className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 font-medium">
            Violation of this policy will result in the immediate termination of your account and forfeiture of any earnings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Monetization & Payouts</h2>
          <p className="mb-4">
            We offer monetization features where you can earn money based on the views your links receive.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Click Fraud:</b> Any attempt to artificially inflate clicks (using bots, proxies, VPNs, or self-clicking) is strictly prohibited. Our anti-fraud system blocks such traffic automatically.</li>
            <li><b>Payout Threshold:</b> The minimum withdrawal amount is <b>₹700</b>.</li>
            <li><b>Payment Methods:</b> We support UPI (Google Pay, PhonePe, Paytm) and Bank Transfer. Payouts are typically processed within 24-48 hours.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Limitation of Liability</h2>
          <p>
            PandaLime is provided on an "as is" and "as available" basis. We are not liable for any damages resulting from the use or inability to use the Service, including but not limited to direct, indirect, incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:microapkdeveloper@gmail.com" className="text-green-600 font-bold hover:underline">microapkdeveloper@gmail.com</a>.
          </p>
        </section>

      </div>
    </div>
  );
};

export default Terms;