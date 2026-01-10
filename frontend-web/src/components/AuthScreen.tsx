/**
 * Authentication Screen
 * Handles user login and registration
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #7e22ce 50%, #1e293b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  wrapper: {
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#e9d5ff',
    fontSize: '1rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '1rem',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1.5rem',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#e9d5ff',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  error: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '0.5rem',
    padding: '0.75rem',
    color: '#fecaca',
    fontSize: '0.875rem',
  },
  button: {
    width: '100%',
    background: '#9333ea',
    color: 'white',
    fontWeight: '600',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.2s',
  },
  buttonDisabled: {
    background: '#6b21a8',
    cursor: 'not-allowed',
  },
  toggle: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#e9d5ff',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'color 0.2s',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center' as const,
    color: 'rgba(233, 213, 255, 0.6)',
    fontSize: '0.875rem',
  },
};

export default function AuthScreen() {
  const { login, register, error, clearError, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setLocalError('');
    clearError();
  };

  const displayError = localError || error;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Monumento</h1>
          <p style={styles.subtitle}>Preserve Your Story</p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label htmlFor="email" style={styles.label}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              />
            </div>

            {displayError && (
              <div style={styles.error}>{displayError}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.background = '#7e22ce';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.background = '#9333ea';
                }
              }}
            >
              {isLoading
                ? (isLoginMode ? 'Logging in...' : 'Creating account...')
                : (isLoginMode ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div style={styles.toggle}>
            <button
              onClick={toggleMode}
              style={styles.toggleButton}
              disabled={isLoading}
              onMouseOver={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.color = '#e9d5ff';
                }
              }}
            >
              {isLoginMode ? (
                <>Don't have an account? <strong>Sign up</strong></>
              ) : (
                <>Already have an account? <strong>Log in</strong></>
              )}
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
