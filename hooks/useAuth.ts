import { useState, useEffect } from 'react';
import { User, SubscriptionPlan, AuthState, AdminState, PaymentRequest } from '../types';
import { simpleHash, generateToken } from '../utils/crypto';

const USERS_KEY = 'quizApp_users';
const PLANS_KEY = 'quizApp_plans';
const PAYMENTS_KEY = 'quizApp_payments';
const SESSION_KEY = 'quizApp_session';
const ADMIN_SESSION_KEY = 'quizApp_admin_session';

const defaultPlans: SubscriptionPlan[] = [
  { id: '1', name: 'All Subjects - 1 Year', price: 50, durationDays: 365 },
  { id: '2', name: 'All Subjects - 6 Months', price: 30, durationDays: 180 },
];

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isSubscribed: false,
    currentUser: null,
    users: [],
    paymentRequests: []
  });

  const [adminState, setAdminState] = useState<AdminState>({
    isAdmin: false,
    plans: [],
  });

  // --- Initialization ---
  useEffect(() => {
    // Load users
    const storedUsers = localStorage.getItem(USERS_KEY);
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Load plans
    const storedPlans = localStorage.getItem(PLANS_KEY);
    const plans: SubscriptionPlan[] = storedPlans ? JSON.parse(storedPlans) : defaultPlans;
    if (!storedPlans) {
      localStorage.setItem(PLANS_KEY, JSON.stringify(defaultPlans));
    }

    // Load payment requests
    const storedPayments = localStorage.getItem(PAYMENTS_KEY);
    const paymentRequests: PaymentRequest[] = storedPayments ? JSON.parse(storedPayments) : [];

    // Check session
    const sessionUsername = localStorage.getItem(SESSION_KEY);
    let currentUser = null;
    
    if (sessionUsername) {
        currentUser = users.find(u => u.username === sessionUsername) || null;
    }
    
    // Check admin
    const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);
    const isAdmin = adminSession === 'true';

    setAuthState({ 
        users, 
        currentUser, 
        isAuthenticated: !!currentUser, 
        isSubscribed: false,
        paymentRequests
    });
    setAdminState({ plans, isAdmin });
  }, []);
  
  // --- Subscription Check ---
  useEffect(() => {
    if (authState.currentUser) {
      if (authState.currentUser.isFreeUser) {
        setAuthState(s => ({ ...s, isSubscribed: true }));
        return;
      }
      
      const sub = authState.currentUser.subscription;
      if (sub && sub.expiresAt > Date.now()) {
        setAuthState(s => ({ ...s, isSubscribed: true }));
      } else {
        setAuthState(s => ({ ...s, isSubscribed: false }));
      }
    } else {
       setAuthState(s => ({ ...s, isSubscribed: false }));
    }
  }, [authState.currentUser]);
  
  // --- Persistence Helpers ---
  const saveUsers = (users: User[]) => {
    setAuthState(s => ({ ...s, users }));
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };
  
  const savePlans = (plans: SubscriptionPlan[]) => {
    setAdminState(s => ({ ...s, plans }));
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  };

  const savePayments = (requests: PaymentRequest[]) => {
    setAuthState(s => ({ ...s, paymentRequests: requests }));
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(requests));
  }

  // --- Auth Actions ---
  const signUp = (username: string, password: string): { success: boolean, message: string } => {
    if (authState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: "Username already taken." };
    }
    const newUser: User = { username, passwordHash: simpleHash(password), paymentStatus: 'none' };
    const updatedUsers = [...authState.users, newUser];
    saveUsers(updatedUsers);
    return { success: true, message: "Signup successful! Please log in." };
  };

  const login = (username: string, password: string): { success: boolean, message: string } => {
    const sessionToken = generateToken();

    // ADMIN LOGIN
    if (username === '$$owner$$sam$$' && password === '7897979381276306') {
      let currentUsers = [...authState.users];
      let adminAsUserIdx = currentUsers.findIndex(u => u.username === '$$owner$$sam$$');
      let adminAsUser = currentUsers[adminAsUserIdx];

      if (adminAsUserIdx === -1) {
        adminAsUser = {
          username: '$$owner$$sam$$',
          passwordHash: simpleHash(password),
          isFreeUser: true,
          sessionToken: sessionToken
        };
        currentUsers.push(adminAsUser);
      } else {
         adminAsUser = { ...adminAsUser, sessionToken: sessionToken };
         currentUsers[adminAsUserIdx] = adminAsUser;
      }
      
      saveUsers(currentUsers);
      setAuthState(s => ({ ...s, currentUser: adminAsUser, isAuthenticated: true }));
      localStorage.setItem(SESSION_KEY, username);
      setAdminState(s => ({ ...s, isAdmin: true }));
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      return { success: true, message: "Admin login successful." };
    }

    // REGULAR LOGIN
    const userIndex = authState.users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        const user = authState.users[userIndex];
        if (user.passwordHash === simpleHash(password)) {
            const updatedUser = { ...user, sessionToken: sessionToken };
            const updatedUsers = [...authState.users];
            updatedUsers[userIndex] = updatedUser;
            
            saveUsers(updatedUsers);
            setAuthState(s => ({ ...s, currentUser: updatedUser, isAuthenticated: true }));
            localStorage.setItem(SESSION_KEY, username);
            return { success: true, message: "Login successful." };
        }
    }
    return { success: false, message: "Invalid username or password." };
  };

  const logout = () => {
    setAuthState(s => ({ ...s, currentUser: null, isAuthenticated: false, isSubscribed: false }));
    localStorage.removeItem(SESSION_KEY);
    setAdminState(s => ({...s, isAdmin: false}));
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  // --- Payment Request Actions ---
  const submitPaymentRequest = (planId: string, transactionId: string, screenshot: string) => {
      if (!authState.currentUser) return;
      
      const plan = adminState.plans.find(p => p.id === planId);
      if (!plan) return;

      const newRequest: PaymentRequest = {
          id: Date.now().toString(),
          username: authState.currentUser.username,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          transactionId: transactionId,
          screenshot: screenshot,
          timestamp: Date.now()
      };

      // Save Request
      savePayments([...authState.paymentRequests, newRequest]);

      // Update User Status
      const updatedUser: User = { ...authState.currentUser, paymentStatus: 'pending' };
      const updatedUsers = authState.users.map(u => u.username === updatedUser.username ? updatedUser : u);
      saveUsers(updatedUsers);
      setAuthState(s => ({...s, currentUser: updatedUser}));
  };

  const approvePayment = (requestId: string) => {
      const request = authState.paymentRequests.find(r => r.id === requestId);
      if (!request) return;

      const plan = adminState.plans.find(p => p.id === request.planId);
      if (!plan) return; // Should handle logic if plan deleted, but assuming valid

      // Calculate expiry based on Approval Date
      const expiresAt = Date.now() + (plan.durationDays * 24 * 60 * 60 * 1000);

      // Update User
      const updatedUsers = authState.users.map(user => {
          if (user.username === request.username) {
              return { 
                  ...user, 
                  paymentStatus: 'approved' as const,
                  subscription: { planId: plan.id, expiresAt }
              };
          }
          return user;
      });
      saveUsers(updatedUsers);

      // Remove Request
      const remainingRequests = authState.paymentRequests.filter(r => r.id !== requestId);
      savePayments(remainingRequests);
  };

  const rejectPayment = (requestId: string) => {
      const request = authState.paymentRequests.find(r => r.id === requestId);
      if (!request) return;

      // Reset User Status
      const updatedUsers = authState.users.map(user => {
          if (user.username === request.username) {
              return { ...user, paymentStatus: 'rejected' as const };
          }
          return user;
      });
      saveUsers(updatedUsers);

      // Remove Request
      const remainingRequests = authState.paymentRequests.filter(r => r.id !== requestId);
      savePayments(remainingRequests);
  };

  // --- Admin User Actions ---
  const createFreeUser = (username: string, password: string): {success: boolean, message: string} => {
    if (authState.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: "Username already taken." };
    }
    const newUser: User = { username, passwordHash: simpleHash(password), isFreeUser: true, paymentStatus: 'approved' };
    const updatedUsers = [...authState.users, newUser];
    saveUsers(updatedUsers);
    return { success: true, message: `Free user '${username}' created.`};
  }

  const toggleFreeAccess = (username: string) => {
    const updatedUsers = authState.users.map(user => {
        if (user.username === username) {
            const newPaymentStatus = (user.isFreeUser ? 'none' : 'approved') as 'none' | 'approved';
            return { ...user, isFreeUser: !user.isFreeUser, paymentStatus: newPaymentStatus };
        }
        return user;
    });
    
    if (authState.currentUser?.username === username) {
        const updatedCurrentUser = updatedUsers.find(u => u.username === username) || null;
        setAuthState(s => ({ ...s, currentUser: updatedCurrentUser }));
    }
    saveUsers(updatedUsers);
  };

  return { 
    authState, 
    adminState, 
    signUp, 
    login, 
    logout,
    savePlans,
    createFreeUser,
    toggleFreeAccess,
    submitPaymentRequest,
    approvePayment,
    rejectPayment
  };
};