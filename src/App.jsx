import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { currentUser } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (!currentUser) {
    return showLogin ? (
      <LoginPage onSwitch={() => setShowLogin(false)} />
    ) : (
      <SignUpPage onSwitch={() => setShowLogin(true)} />
    );
  }

  return <DashboardPage />;
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white font-sans bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/30">
        <div className="w-full">
            <AppContent />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;