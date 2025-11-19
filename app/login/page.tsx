'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();

    // Check for error message
    const error = searchParams.get('error');
    if (error) {
      setMessage(`Error: ${error}`);
      setMessageType('error');

      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());

      setTimeout(() => setMessage(''), 5000);
    }
  }, [searchParams, router]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();

      if (data.authenticated) {
        // User is already logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        setChecking(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setChecking(false);
    }
  };

  const getMessageStyles = () => {
    switch (messageType) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Google Calendar Webhook Admin
        </h1>
        <p className="text-gray-600 mb-6">
          Sign in with your Google account to manage calendar webhooks and create events.
        </p>
        <a
          href="/api/auth/login"
          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign in with Google
        </a>
        {message && (
          <div className={`mt-4 p-3 rounded ${getMessageStyles()}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
