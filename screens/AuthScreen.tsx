import React, { useState } from 'react';
import { User, Key, Info, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  login: (username: string, password: string) => { success: boolean; message: string };
  signUp: (username: string, password: string) => { success: boolean; message: string };
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ login, signUp }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateSignup = (u: string, p: string): string | null => {
    // Username Logic: Must contain at least 3 alphabets and 3 numbers
    const alphaCount = (u.match(/[a-zA-Z]/g) || []).length;
    const numCount = (u.match(/[0-9]/g) || []).length;

    if (alphaCount < 3 || numCount < 3) {
      return "Username must contain at least 3 letters and 3 numbers (e.g., sam123).";
    }

    // Password Logic: Min 3 Alpha, 3 Number, 1 Special Char
    const passAlpha = (p.match(/[a-zA-Z]/g) || []).length;
    const passNum = (p.match(/[0-9]/g) || []).length;
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(p);
    
    if (passAlpha < 3) return "Password must contain at least 3 letters.";
    if (passNum < 3) return "Password must contain at least 3 numbers.";
    if (!hasSpecial) return "Password must contain at least 1 special character.";

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    // Strict Validation only for Sign Up
    if (!isLogin) {
      const validationError = validateSignup(username, password);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const action = isLogin ? login : signUp;
    const result = action(username, password);

    if (result.success) {
      if (isLogin) {
        // App will handle redirect
      } else {
        setSuccess(result.message);
        setIsLogin(true); // Switch to login form after successful signup
        setUsername('');
        setPassword('');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">SSC AI Quiz</h1>
          <p className="text-slate-400 mt-2">{isLogin ? "Welcome back! Please log in." : "Create an account to start."}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-400 block mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder={isLogin ? "Enter username" : "e.g., sam123"}
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-slate-500 mt-1 flex items-start">
                   <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0"/> Min 3 letters & 3 numbers
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 block mb-2">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-slate-500 mt-1 flex items-start">
                   <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0"/> Min 3 letters, 3 numbers, 1 special char
                </p>
              )}
            </div>
            {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 p-3 rounded-lg">{error}</p>}
            {success && <p className="text-sm text-green-400 bg-green-900/20 border border-green-800 p-3 rounded-lg">{success}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-transform active:scale-95 shadow-lg shadow-blue-900/20"
            >
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          <div className="text-center mt-6">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="text-sm text-slate-400 hover:text-blue-400">
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};