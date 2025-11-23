import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './screens/AuthScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { QuizScreen } from './screens/QuizScreen';
import { AdminPanel } from './components/AdminPanel';

const App: React.FC = () => {
  const { authState, adminState, login, signUp, logout, savePlans, createFreeUser, toggleFreeAccess, submitPaymentRequest, approvePayment, rejectPayment } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const handleOpenAdminPanel = () => {
      setShowAdminPanel(true);
  };

  const renderContent = () => {
    if (!authState.isAuthenticated) {
      return <AuthScreen login={login} signUp={signUp} />;
    }
    if (!authState.isSubscribed) {
      return (
          <SubscriptionScreen 
            plans={adminState.plans} 
            currentUser={authState.currentUser}
            submitPaymentRequest={submitPaymentRequest} 
            logout={logout}
          />
      );
    }
    return (
        <QuizScreen 
            logout={logout} 
            openAdminPanel={handleOpenAdminPanel} 
            isAdmin={adminState.isAdmin}
            currentUser={authState.currentUser}
        />
    );
  };

  return (
    <>
      {renderContent()}
      
      {showAdminPanel && adminState.isAdmin && (
        <AdminPanel 
          initialPlans={adminState.plans}
          users={authState.users}
          paymentRequests={authState.paymentRequests}
          savePlans={savePlans}
          createFreeUser={createFreeUser}
          toggleFreeAccess={toggleFreeAccess}
          approvePayment={approvePayment}
          rejectPayment={rejectPayment}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </>
  );
};

export default App;