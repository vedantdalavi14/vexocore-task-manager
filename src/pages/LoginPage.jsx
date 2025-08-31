import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginPage({ onShowSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User is now logged in, AuthContext will handle the redirect
    } catch (err) {
      setError('Failed to log in. Please check your email and password.');
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Login</h2>
        {error && <p className="bg-red-500 text-white text-sm py-2 px-3 rounded mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" type="submit">
            Login
          </button>
          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <button type="button" onClick={onShowSignUp} className="font-bold text-blue-500 hover:text-blue-400">
              Sign Up
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
