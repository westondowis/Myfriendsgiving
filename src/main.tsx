import React, { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center text-[#2C1E16]">
          <span className="text-4xl mb-3">🦃 🍂</span>
          <h2 className="font-serif text-2xl font-bold mb-2">Friendsgiving Feast Ledger</h2>
          <p className="text-sm text-[#705F55] max-w-md mb-4">
            Something temporarily interrupted loading the ledger.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#8C3A27] text-white rounded-xl text-xs font-bold hover:bg-[#732E1E] transition cursor-pointer"
          >
            Reload Ledger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
