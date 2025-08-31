import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock } from 'lucide-react';

export default function LoginPage({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back!"
      subtitle="Log in to continue managing your tasks."
      switchFormText="Don't have an account?"
      switchFormLink="Sign Up"
      onSwitch={onSwitch}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="bg-red-500/20 border border-red-500 text-red-300 text-sm py-2 px-3 rounded-lg">{error}</p>}
        
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="shadow-inner appearance-none border border-gray-600 rounded-lg w-full py-3 pl-10 pr-3 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="shadow-inner appearance-none border border-gray-600 rounded-lg w-full py-3 pl-10 pr-3 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </AuthLayout>
  );
}

