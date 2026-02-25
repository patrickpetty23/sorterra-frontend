import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Folder } from 'lucide-react';
import { authApi, apiClient } from '../api';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

function Register() {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({ name: formData.name, email: formData.email, password: formData.password });
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.confirmRegistration({ email: formData.email, code: verificationCode });

      // Auto-login to get a token, then create the database user record
      const user = await login({ email: formData.email, password: formData.password });

      await apiClient.post('/api/users', {
        cognitoSub: user.sub,
        email: user.email,
        displayName: user.name,
      }).catch(() => {
        // Non-fatal: DB record may already exist or will be created later
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await authApi.resendConfirmationCode({ email: formData.email });
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  if (step === 'verify') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <Folder size={32} color="#3B82F6" />
              <h1>Sorterra</h1>
            </div>
            <p className="auth-subtitle">Check your email for a verification code.</p>
          </div>

          <form onSubmit={handleVerify} className="auth-form">
            {error && <div className="error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                required
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <p className="auth-footer">
            Didn't receive a code?{' '}
            <button className="link-button" onClick={handleResend} disabled={loading}>
              Resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <Folder size={32} color="#3B82F6" />
            <h1>Sorterra</h1>
          </div>
          <p className="auth-subtitle">Create your account to get started.</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
