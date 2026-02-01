import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/payouts/admin/all');
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
    try {
      await api.put(`/payouts/admin/${id}`, { status });
      toast.success(`Request ${status}`);
      fetchRequests(); // Refresh list
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Payout Management</h1>
      
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Method (UPI)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-bold text-gray-800">{req.bank_holder_name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{req.email}</div>
                </td>
                <td className="p-4 font-mono font-bold text-green-600">₹{req.amount}</td>
                <td className="p-4 text-sm font-mono">{req.upi_id}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {new Date(req.requested_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  {req.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleProcess(req.id, 'approved')}
                        className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Mark as Paid"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                         onClick={() => handleProcess(req.id, 'rejected')}
                         className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                         title="Reject & Refund"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                  {req.status !== 'pending' && <span className="text-gray-400 text-xs italic">Processed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <div className="p-8 text-center text-gray-400">No payout requests found.</div>}
      </div>
    </div>
  );
};

export default AdminPanel;