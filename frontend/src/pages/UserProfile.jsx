import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiSave, FiCheck } from 'react-icons/fi';
import './UserProfile.css';

const API_BASE = 'http://localhost:5000/api';

export default function UserProfile() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.username) {
        setInitialLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/profile/${user.username}`);
        let fullName = '';
        let fetchedEmail = '';
        if (res.ok) {
          const data = await res.json();
          fullName = data.full_name || '';
          fetchedEmail = data.email || '';
          setCurrentPassword(data.password || '********');
        }
        
        setFormData(prev => ({
          ...prev,
          username: user.username,
          email: fetchedEmail || user.email || '',
          full_name: fullName
        }));
      } catch (err) {
        console.error("Failed to load profile", err);
      }
      setInitialLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name?.trim()) errs.full_name = 'Name is required';
    if (!formData.username?.trim()) errs.username = 'Username is required';
    if (!formData.email?.trim() && !isAdmin) errs.email = 'Email is required';
    
    if (formData.password) {
      if (formData.password.length < 6) {
        errs.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirm_password) {
        errs.confirm_password = 'Passwords do not match';
      }
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before saving.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        currentUsername: user.username,
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password || undefined
      };

      const res = await fetch(`${API_BASE}/users/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local storage and context
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      userData.username = data.newUsername;
      userData.email = data.newEmail || userData.email;
      localStorage.setItem('user_data', JSON.stringify(userData));

      toast.success('Your profile has been updated!');
      
      // If username changed, we should probably force a reload to refresh context
      if (payload.currentUsername !== payload.username) {
        setTimeout(() => window.location.reload(), 1500);
      } else {
        // Just clear password fields
        setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
        if (payload.password) setCurrentPassword(payload.password);
      }
      
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <main id="main-content" className="eligibility-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="eligibility-header animate-fade-in">
          <h1 className="page-title">
            {isAdmin ? 'Admin Profile Settings' : 'Registration Details'}
          </h1>
          <p className="eligibility-subtitle">
            {isAdmin 
              ? 'Manage your administrator credentials and contact details.' 
              : "Manage your account's login credentials and personal identity."}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="eligibility-form" style={{ maxWidth: '100%' }}>
          <section className="form-section card-static animate-slide-up">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-blue"><FiUser size={20} /></div>
              <div>
                <h2 className="section-title">
                  {isAdmin ? 'Admin Credentials' : 'Profile Settings'}
                </h2>
                <p className="section-desc">
                  {isAdmin ? 'Update your secure login and contact info' : 'Update your registration information'}
                </p>
              </div>
              <FiCheck className="section-check" size={20} />
            </div>

            <div className="section-fields">
              <div className="input-group">
                <label>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
                  <input 
                    name="full_name"
                    type="text" 
                    className={`input-field ${errors.full_name ? 'error' : ''}`} 
                    value={formData.full_name} 
                    onChange={handleChange}
                    style={{ paddingLeft: 40 }} 
                  />
                </div>
                {errors.full_name && <span className="input-error-text">{errors.full_name}</span>}
              </div>

              <div className="input-group">
                <label>Username *</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
                  <input 
                    name="username"
                    type="text" 
                    className={`input-field ${errors.username ? 'error' : ''}`} 
                    value={formData.username} 
                    onChange={handleChange}
                    style={{ paddingLeft: 40 }} 
                  />
                </div>
                {errors.username && <span className="input-error-text">{errors.username}</span>}
              </div>

              <div className="input-group">
                <label>Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
                  <input 
                    name="email"
                    type="email" 
                    className={`input-field ${errors.email ? 'error' : ''}`} 
                    value={formData.email} 
                    onChange={handleChange}
                    style={{ paddingLeft: 40 }} 
                  />
                </div>
                {errors.email && <span className="input-error-text">{errors.email}</span>}
              </div>

              <div className="input-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                <label>New Password (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
                  <input 
                    name="password"
                    type="text" 
                    className={`input-field ${errors.password ? 'error' : ''}`} 
                    value={formData.password} 
                    onChange={handleChange}
                    placeholder={`Current: ${currentPassword}`}
                    style={{ paddingLeft: 40 }} 
                  />
                </div>
                {errors.password && <span className="input-error-text">{errors.password}</span>}
              </div>

              {formData.password && (
                <div className="input-group">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <FiLock style={{ position: 'absolute', top: 12, left: 12, color: 'var(--text-muted)' }} />
                    <input 
                      name="confirm_password"
                      type="text" 
                      className={`input-field ${errors.confirm_password ? 'error' : ''}`} 
                      value={formData.confirm_password} 
                      onChange={handleChange}
                      placeholder="Confirm your new password"
                      style={{ paddingLeft: 40 }} 
                    />
                  </div>
                  {errors.confirm_password && <span className="input-error-text">{errors.confirm_password}</span>}
                </div>
              )}
            </div>
          </section>

          <div className="form-actions animate-slide-up">
            <button type="submit" className="btn btn-primary btn-lg eligibility-submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? (
                <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Saving Changes...</>
              ) : (
                <><FiSave size={18} /> {isAdmin ? 'Save Admin Details' : 'Save Registration Details'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
