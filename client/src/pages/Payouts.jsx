import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { IndianRupee, CreditCard, History, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Payouts = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Form State
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, historyRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/payouts/history')
      ]);
      
      setUser(userRes.data);
      setHistory(historyRes.data);
      
      // Pre-fill form
      setUpiId(userRes.data.upi_id || '');
      setBankAccount(userRes.data.bank_account_no || '');
      setIfsc(userRes.data.bank_ifsc || '');
      setHolderName(userRes.data.bank_holder_name || '');
      
    } catch (error) {
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put('/auth/payment-details', {
        upi_id: upiId,
        bank_account_no: bankAccount,
        bank_ifsc: ifsc,
        bank_holder_name: holderName
      });
      toast.success('Payment details saved!');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update details');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!window.confirm(`Request withdrawal of ₹${user?.wallet_balance}?`)) return;
    
    if (!upiId && !bankAccount) {
      toast.error('Please add a UPI ID or Bank Account first.');
      return;
    }

    try {
      await api.post('/payouts/request');
      toast.success('Payout request submitted!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Request failed');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Payouts...</div>;

  const currentBalance = parseFloat(user?.wallet_balance || 0);
  const canWithdraw = currentBalance >= 700;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <IndianRupee className="text-green-600" /> Wallet & Payouts
      </h1>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        
        {/* BALANCE CARD */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <IndianRupee size={120} />
          </div>
          <p className="text-gray-400 font-medium mb-1">Available Balance</p>
          <h2 className="text-5xl font-bold mb-6">₹{currentBalance.toFixed(2)}</h2>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRequestPayout}
              disabled={!canWithdraw}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                canWithdraw 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canWithdraw ? 'Withdraw Money' : 'Min. Payout ₹700'}
            </button>
            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              <AlertCircle size={12} /> Payouts processed within 24-48 hours.
            </p>
          </div>
        </div>

        {/* PAYMENT SETTINGS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-primary" /> Payment Method
          </h3>
          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UPI ID (Preferred)</label>
              <input 
                type="text" 
                placeholder="e.g. name@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account No</label>
                <input 
                  type="text" 
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
                <input 
                  type="text" 
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={updating}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 rounded-lg transition-colors"
            >
              {updating ? 'Saving...' : 'Save Payment Details'}
            </button>
          </form>
        </div>
      </div>

      {/* PAYOUT HISTORY */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <History size={18} /> Withdrawal History
          </h3>
        </div>
        
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No payout requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(item.requested_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{item.amount}</td>
                    <td className="px-6 py-4">
                      {item.status === 'pending' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold"><Clock size={12}/> Pending</span>}
                      {item.status === 'approved' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle size={12}/> Paid</span>}
                      {item.status === 'rejected' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><AlertCircle size={12}/> Rejected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payouts;