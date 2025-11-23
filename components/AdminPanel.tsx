import React, { useState } from 'react';
import { SubscriptionPlan, User, PaymentRequest } from '../types';
import { Shield, Plus, Trash2, Save, UserPlus, X, Users, CreditCard, Banknote, CheckCircle, XCircle, Eye, Image as ImageIcon } from 'lucide-react';

interface AdminPanelProps {
  initialPlans: SubscriptionPlan[];
  users: User[];
  paymentRequests: PaymentRequest[];
  savePlans: (plans: SubscriptionPlan[]) => void;
  createFreeUser: (username: string, password: string) => {success: boolean, message: string};
  toggleFreeAccess: (username: string) => void;
  approvePayment: (id: string) => void;
  rejectPayment: (id: string) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    initialPlans, 
    users, 
    paymentRequests,
    savePlans, 
    createFreeUser, 
    toggleFreeAccess, 
    approvePayment,
    rejectPayment,
    onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'users' | 'payments'>('payments');
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', durationDays: '' });
  const [freeUsername, setFreeUsername] = useState('');
  const [freePassword, setFreePassword] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const regularUsers = users.filter(user => user.username !== '$$owner$$sam$$');

  const showNotification = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handlePlanChange = (index: number, field: keyof Omit<SubscriptionPlan, 'id'>, value: string) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setPlans(updatedPlans);
  };

  const handleAddPlan = () => {
    if (newPlan.name && newPlan.price && newPlan.durationDays) {
      setPlans([
        ...plans,
        {
          id: Date.now().toString(),
          name: newPlan.name,
          price: parseInt(newPlan.price),
          durationDays: parseInt(newPlan.durationDays),
        },
      ]);
      setNewPlan({ name: '', price: '', durationDays: '' });
    } else {
        showNotification("All new plan fields are required.", "error");
    }
  };

  const handleRemovePlan = (id: string) => {
    setPlans(plans.filter((plan) => plan.id !== id));
  };

  const handleSaveChanges = () => {
    savePlans(plans);
    showNotification("Changes saved successfully!", "success");
  };

  const handleCreateFreeUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!freeUsername || !freePassword) {
          showNotification("Username and password required.", "error");
          return;
      }
      const result = createFreeUser(freeUsername, freePassword);
      showNotification(result.message, result.success ? 'success' : 'error');
      if (result.success) {
          setFreeUsername('');
          setFreePassword('');
      }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 w-full max-w-2xl h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto">
             <button 
                onClick={() => setActiveTab('payments')}
                className={`flex-1 py-3 px-2 font-semibold text-sm flex items-center justify-center space-x-2 whitespace-nowrap ${activeTab === 'payments' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
            >
                <Banknote className="w-4 h-4" /> <span>Requests ({paymentRequests.length})</span>
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-3 px-2 font-semibold text-sm flex items-center justify-center space-x-2 whitespace-nowrap ${activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
            >
                <Users className="w-4 h-4" /> <span>Users ({regularUsers.length})</span>
            </button>
            <button 
                onClick={() => setActiveTab('plans')}
                className={`flex-1 py-3 px-2 font-semibold text-sm flex items-center justify-center space-x-2 whitespace-nowrap ${activeTab === 'plans' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'}`}
            >
                <CreditCard className="w-4 h-4" /> <span>Plans</span>
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 relative">

          {activeTab === 'payments' && (
              <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-4">Pending Payment Requests</h3>
                  {paymentRequests.length === 0 ? (
                      <div className="text-slate-500 text-center py-8">No pending requests.</div>
                  ) : (
                    <div className="space-y-4">
                        {paymentRequests.map(req => (
                            <div key={req.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-bold text-white text-lg">{req.username}</span>
                                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800">₹{req.amount}</span>
                                    </div>
                                    <p className="text-sm text-slate-400">{req.planName}</p>
                                    <div className="mt-2 text-xs font-mono bg-slate-900 px-2 py-1 rounded inline-block text-slate-300">
                                        UTR: {req.transactionId}
                                    </div>
                                    {req.screenshot && (
                                        <button 
                                            onClick={() => setViewImage(req.screenshot)}
                                            className="ml-2 text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded inline-flex items-center space-x-1"
                                        >
                                            <ImageIcon className="w-3 h-3" /> <span>View Screenshot</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3 w-full sm:w-auto">
                                    <button 
                                        onClick={() => rejectPayment(req.id)}
                                        className="flex-1 sm:flex-none py-2 px-4 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-900/20 flex items-center justify-center"
                                    >
                                        <XCircle className="w-5 h-5 mr-1" /> Reject
                                    </button>
                                    <button 
                                        onClick={() => approvePayment(req.id)}
                                        className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-900/20"
                                    >
                                        <CheckCircle className="w-5 h-5 mr-1" /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
          )}
          
          {activeTab === 'plans' && (
            <>
                {/* Manage Plans */}
                <div>
                    <h3 className="text-lg font-semibold text-blue-300 mb-4">Subscription Plans</h3>
                    <div className="space-y-4">
                    {plans.map((plan, index) => (
                        <div key={plan.id} className="grid grid-cols-12 gap-2 items-center bg-slate-800/50 p-3 rounded-lg">
                        <input value={plan.name} onChange={(e) => handlePlanChange(index, 'name', e.target.value)} placeholder="Plan Name" className="col-span-5 bg-slate-700 p-2 rounded text-xs sm:text-sm text-white"/>
                        <input type="number" value={plan.price} onChange={(e) => handlePlanChange(index, 'price', e.target.value)} placeholder="Price" className="col-span-3 bg-slate-700 p-2 rounded text-xs sm:text-sm text-white"/>
                        <input type="number" value={plan.durationDays} onChange={(e) => handlePlanChange(index, 'durationDays', e.target.value)} placeholder="Days" className="col-span-3 bg-slate-700 p-2 rounded text-xs sm:text-sm text-white"/>
                        <button onClick={() => handleRemovePlan(plan.id)} className="col-span-1 flex justify-center items-center text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5"/></button>
                        </div>
                    ))}
                    <div className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border-2 border-dashed border-slate-700">
                        <input value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} placeholder="New Name" className="col-span-5 bg-slate-700 p-2 rounded text-xs sm:text-sm text-white"/>
                        <input type="number" value={newPlan.price} onChange={(e) => setNewPlan({...newPlan, price: e.target.value})} placeholder="Price" className="col-span-3 bg-slate-700 p-2 rounded text-xs sm:text-sm text-white"/>
                        <input type="number" value={newPlan.durationDays} onChange={(e) => setNewPlan({...newPlan, durationDays: e.target.value})} placeholder="Days" className="col-span-3 bg-slate-700 p-2 rounded text-xs sm:text-sm text-white"/>
                        <button onClick={handleAddPlan} className="col-span-1 flex justify-center items-center text-green-400 hover:text-green-300"><Plus className="w-6 h-6"/></button>
                        </div>
                    </div>
                </div>
                
                {/* Create Free User */}
                <div>
                    <h3 className="text-lg font-semibold text-blue-300 mb-4">Create Free User</h3>
                    <form onSubmit={handleCreateFreeUser} className="bg-slate-800/50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full"><input value={freeUsername} onChange={e => setFreeUsername(e.target.value)} placeholder="New Username" className="w-full bg-slate-700 p-2 rounded text-white"/></div>
                    <div className="flex-1 w-full"><input type="password" value={freePassword} onChange={e => setFreePassword(e.target.value)} placeholder="Set Password" className="w-full bg-slate-700 p-2 rounded text-white"/></div>
                    <button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2">
                        <UserPlus className="w-5 h-5"/><span>Create</span>
                    </button>
                    </form>
                </div>
            </>
          )}

          {activeTab === 'users' && (
              <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-4">Registered Users</h3>
                  <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900/50 text-slate-400">
                              <tr>
                                  <th className="p-3">Username</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                              {regularUsers.map(user => (
                                  <tr key={user.username} className="hover:bg-slate-700/30">
                                      <td className="p-3 font-medium text-white">{user.username}</td>
                                      <td className="p-3">
                                          {user.isFreeUser ? (
                                              <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded-full text-xs border border-green-800">Lifetime Free</span>
                                          ) : user.subscription && user.subscription.expiresAt > Date.now() ? (
                                              <span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full text-xs border border-blue-800">Subscribed</span>
                                          ) : (
                                              <span className="bg-slate-700 text-slate-400 px-2 py-1 rounded-full text-xs">Not Subscribed</span>
                                          )}
                                      </td>
                                      <td className="p-3 text-right">
                                        <button 
                                            onClick={() => toggleFreeAccess(user.username)}
                                            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center justify-center ml-auto transition-colors ${user.isFreeUser ? 'border-red-500/50 text-red-400 hover:bg-red-900/20' : 'border-green-500/50 text-green-400 hover:bg-green-900/20'}`}
                                        >
                                            {user.isFreeUser ? 'Revoke Free' : 'Grant Free'}
                                        </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {regularUsers.length === 0 && <div className="p-4 text-center text-slate-500">No regular users found.</div>}
                  </div>
              </div>
          )}

          {/* Image Preview Modal */}
          {viewImage && (
             <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                 <div className="relative max-w-full max-h-full">
                    <img src={viewImage} alt="Proof" className="max-w-full max-h-[80vh] rounded-lg border border-slate-700"/>
                    <button className="absolute -top-10 right-0 text-white hover:text-red-400" onClick={() => setViewImage(null)}>Close</button>
                 </div>
             </div>
          )}

        </div>

        {activeTab === 'plans' && (
            <div className="p-4 border-t border-slate-800 flex justify-end">
            <button onClick={handleSaveChanges} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg flex items-center space-x-2">
                <Save className="w-5 h-5" />
                <span>Save All Changes</span>
            </button>
            </div>
        )}
        
        {notification && (
            <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white font-semibold ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                {notification.message}
            </div>
        )}

      </div>
    </div>
  );
};