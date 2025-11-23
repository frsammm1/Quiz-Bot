import React, { useState, useRef } from 'react';
import { SubscriptionPlan, User } from '../types';
import { ShieldCheck, Clock, LogOut, CheckCircle2, AlertCircle, Upload, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface SubscriptionScreenProps {
  plans: SubscriptionPlan[];
  currentUser: User | null;
  submitPaymentRequest: (planId: string, transactionId: string, screenshot: string) => void;
  logout: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ plans, currentUser, submitPaymentRequest, logout }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upiId = 'thefatherofficial-3@okaxis';

  const isPending = currentUser?.paymentStatus === 'pending';
  const isRejected = currentUser?.paymentStatus === 'rejected';

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedPlan && transactionId && screenshot) {
          submitPaymentRequest(selectedPlan.id, transactionId, screenshot);
          setSelectedPlan(null);
      } else {
          alert("Please enter Transaction ID and upload a Screenshot.");
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setScreenshot(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPending) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-yellow-500/10 p-6 rounded-full mb-6 animate-pulse">
                <Clock className="w-16 h-16 text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Verification Pending</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
                Your payment details have been submitted. The admin is currently verifying your transaction. 
                <br/><br/>
                Please wait. Access will be granted shortly after approval.
            </p>
            <button onClick={logout} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                <LogOut className="w-5 h-5"/>
                <span>Logout & Check Later</span>
            </button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-4 pt-10 relative">
      <button onClick={logout} className="absolute top-4 right-4 flex items-center space-x-2 text-sm text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
        <LogOut className="w-4 h-4"/>
        <span>Logout</span>
      </button>

      <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-emerald-500/10 p-4 rounded-full inline-block mb-4 ring-1 ring-emerald-500/50">
             <ShieldCheck className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Unlock Full Access</h1>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">Choose a plan to continue your preparation.</p>
        
        {isRejected && (
            <div className="mt-4 bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center justify-center space-x-2 max-w-md mx-auto">
                <AlertCircle className="w-5 h-5" />
                <span>Your previous payment was rejected. Please try again.</span>
            </div>
        )}
      </div>

      <div className="w-full max-w-md space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="group bg-slate-900 hover:bg-slate-800 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 flex justify-between items-center shadow-xl transition-all duration-300">
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">{plan.name}</h2>
              <p className="text-slate-400 text-sm mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1"/> {plan.durationDays} Days Validity
              </p>
            </div>
            <button
              onClick={() => setSelectedPlan(plan)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              ₹{plan.price}
            </button>
          </div>
        ))}
      </div>

      {/* Manual Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-sm relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <button 
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
                ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-white shrink-0">Complete Payment</h2>
            
            <div className="bg-slate-800 p-4 rounded-xl mb-4 space-y-3 shrink-0">
                <div className="flex justify-between items-end">
                    <div>
                         <p className="text-xs text-slate-400 uppercase tracking-wide">Pay Amount</p>
                         <div className="text-2xl font-bold text-white">₹{selectedPlan.price}</div>
                    </div>
                </div>
                <div className="h-px bg-slate-700"></div>
                
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">To UPI ID</p>
                    <div className="flex items-center space-x-2">
                        <code className="text-blue-300 font-mono bg-blue-900/20 px-2 py-1.5 rounded flex-1 truncate">{upiId}</code>
                        <button 
                            onClick={handleCopyUpi}
                            className="bg-slate-700 hover:bg-slate-600 p-1.5 rounded-lg transition-colors text-slate-300"
                            title="Copy UPI ID"
                        >
                            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <a 
                  href={`upi://pay?pa=${upiId}&pn=SSCQuiz&am=${selectedPlan.price}&cu=INR`}
                  className="w-full flex items-center justify-center space-x-2 bg-white text-slate-900 hover:bg-slate-200 font-bold py-2.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pay with UPI App</span>
                </a>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Transaction ID / UTR</label>
                    <input 
                        required
                        type="text" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 321456789012"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Payment Screenshot</label>
                    <input 
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${screenshot ? 'border-green-500/50 bg-green-900/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}
                    >
                        {screenshot ? (
                            <div className="flex items-center text-green-400 space-x-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm">Screenshot Uploaded</span>
                            </div>
                        ) : (
                            <div className="text-slate-500 flex flex-col items-center">
                                <Upload className="w-6 h-6 mb-2" />
                                <span className="text-xs">Tap to upload screenshot</span>
                            </div>
                        )}
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-900/20 mt-4"
                >
                    Share Screenshot & Verify
                </button>
            </form>

            <p className="text-[10px] text-slate-500 mt-3 text-center leading-relaxed shrink-0">
                Admin will verify your UTR and Screenshot.<br/>Approval typically takes 10-30 minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};