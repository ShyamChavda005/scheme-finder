import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiMapPin, FiBriefcase, FiDollarSign, FiEdit2 } from 'react-icons/fi';
import './MyEligibility.css';

const API_BASE = 'http://localhost:5000/api';

export default function MyEligibility() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/profile/${user.username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <main id="main-content" className="eligibility-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </main>
    );
  }

  if (!profile || !profile.age) {
    return (
      <main id="main-content" className="eligibility-page">
        <div className="container" style={{ maxWidth: '700px' }}>
          <div className="empty-state card">
            <div className="empty-state-icon">📋</div>
            <h2 className="empty-state-title">No Eligibility Data Found</h2>
            <p className="empty-state-text">You have not filled out the Scheme Finder form yet. Fill it out to discover matching schemes!</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/finder')}>Go to Scheme Finder</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <header className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">My Eligibility Profile</h1>
            <p className="eligibility-subtitle">The data you submitted to find matching schemes.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/finder')}>
            <FiEdit2 size={18} /> Update Data
          </button>
        </header>

        <div className="grid grid-2 animate-slide-up">
          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-blue"><FiFileText size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Personal Info</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Age:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.age}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Gender:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.gender}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Category:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.category}</span></li>
            </ul>
          </div>

          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper section-icon-green"><FiMapPin size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Location</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>State:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.state}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>District:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.district}</span></li>
            </ul>
          </div>

          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><FiBriefcase size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Education & Income</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Education:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.education_level}</span></li>
              <li><strong style={{ color: 'var(--text-muted)' }}>Annual Income:</strong> <span style={{ float: 'right', fontWeight: 500 }}>₹{profile.family_income?.toLocaleString()}</span></li>
            </ul>
          </div>

          <div className="card-static form-section">
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <div className="section-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><FiDollarSign size={20} /></div>
              <div>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Disability Status</h3>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><strong style={{ color: 'var(--text-muted)' }}>Has Disability:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.has_disability ? 'Yes' : 'No'}</span></li>
              {profile.has_disability ? (
                <>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Type:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.disability_type}</span></li>
                  <li><strong style={{ color: 'var(--text-muted)' }}>Percentage:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.disability_percentage}%</span></li>
                  {profile.udid_number && <li><strong style={{ color: 'var(--text-muted)' }}>UDID:</strong> <span style={{ float: 'right', fontWeight: 500 }}>{profile.udid_number}</span></li>}
                </>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
