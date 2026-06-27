import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await login(username, password);
      if (response.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-noise"></div>
      
      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-container-glow"></div>
          
          <div className="auth-card">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to manage your schemes</p>
            </div>



            {error && <div className="auth-error" role="alert">{error}</div>}

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Username Input */}
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input 
                  id="username"
                  type="text" 
                  className="input-field" 
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input 
                    id="password"
                    type={showPassword ? 'text' : 'password'} 
                    className="input-field" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="auth-options">
                <label className="login-checkbox">
                  <input type="checkbox" />
                  <span className="login-checkbox-text">Remember me</span>
                </label>
                <a href="#" className="auth-forgot-link">Forgot Password?</a>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading}
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <FiArrowRight size={18} />}
              </button>
            </form>

            {/* Footer Text */}
            <div className="auth-switch">
              Don't have an account? <Link to="/signup">Create new</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative background elements */}
      <div className="auth-bg-orbs">
        <div className="auth-bg-orb-1"></div>
        <div className="auth-bg-orb-2"></div>
      </div>
    </div>
  );
}
