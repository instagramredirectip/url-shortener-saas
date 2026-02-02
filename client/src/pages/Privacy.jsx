import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-600">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Shield className="text-green-500" /> Privacy Policy
          </h1>
          <p className="text-slate-400">Effective Date: February 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 leading-relaxed">
        
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We collect information to provide better services to our users. This includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Account Information:</b> When you register, we collect your email address and password (encrypted).</li>
            <li><b>Payment Information:</b> Your UPI ID or Bank details are stored securely solely for the purpose of processing payouts.</li>
            <li><b>Usage Data:</b> We collect IP addresses, browser types, and device information for analytics and fraud prevention purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our Service.</li>
            <li>To process your earnings and payouts.</li>
            <li>To detect and prevent fraudulent activity (e.g., bot clicks).</li>
            <li>To improve user experience and optimize our ad formats.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your password is hashed using <b>Bcrypt</b>, and our database is protected by enterprise-grade firewalls. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Cookies</h2>
          <p>
            We use cookies to maintain your login session and to track analytics. You can choose to disable cookies through your browser settings, but this may limit your ability to use certain features of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>

      </div>
    </div>
  );
};

export default Privacy;