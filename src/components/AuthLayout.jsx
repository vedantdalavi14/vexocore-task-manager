import React from 'react';
import { CheckSquare } from 'lucide-react';

// This component provides a consistent wrapper for the Login and Sign Up pages.
export default function AuthLayout({ children, title, subtitle, switchFormText, switchFormLink, onSwitch }) {
  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="flex justify-center items-center mb-8">
        <CheckSquare className="w-10 h-10 text-blue-500" />
        <h1 className="ml-4 text-4xl font-bold text-white tracking-tighter">TaskFlow</h1>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold mb-2 text-center text-white">{title}</h2>
        <p className="text-center text-gray-400 mb-6">{subtitle}</p>
        
        {children}
        
        <p className="text-center text-sm text-gray-400 mt-6">
          {switchFormText}{' '}
          <button onClick={onSwitch} className="font-medium text-blue-500 hover:text-blue-400">
            {switchFormLink}
          </button>
        </p>
      </div>
    </div>
  );
}

