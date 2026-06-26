import { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiFilter, FiVolume2, FiInbox, FiTrendingUp, FiCheckCircle, FiPercent, FiShield } from 'react-icons/fi';
import SchemeCard from '../components/SchemeCard';
import TextToSpeech from '../components/TextToSpeech';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const API_BASE = 'http://localhost:5000/api';
const SCHEME_TYPES = ['All', 'Scholarship', 'Pension', 'Assistive Device', 'Employment', 'Skill Training', 'Financial Assistance', 'Other'];

// ═══ SKELETON COMPONENTS ═══
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-badge skeleton-pulse" />
        <div className="skeleton-date skeleton-pulse" />
      </div>
      <div className="skeleton-title skeleton-pulse" />
      <div className="skeleton-ministry skeleton-pulse" />
      <div className="skeleton-line skeleton-pulse" />
      <div className="skeleton-line short skeleton-pulse" />
      <div className="skeleton-footer">
        <div className="skeleton-btn skeleton-pulse" />
      </div>
    </div>
  );
}

function SkeletonSummary() {
  return (
    <div className="summary-cards grid grid-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="card summary-card">
          <div className="skeleton-icon skeleton-pulse" />
          <div style={{ flex: 1 }}>
            <div className="skeleton-stat-val skeleton-pulse" />
            <div className="skeleton-stat-label skeleton-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTTS, setShowTTS] = useState(false);
  const [matchStats, setMatchStats] = useState({ total: 0, highMatch: 0, avgScore: 0 });

  useEffect(() => {
    const fetchEligibleSchemes = async () => {
      setLoading(true);
      try {
        // 1. Get user profile from backend
        const username = user?.username || 'guest';
        const profileRes = await fetch(`${API_BASE}/profile/${username}`);

        if (!profileRes.ok) {
          setError('profile_incomplete');
          setLoading(false);
          return;
        }

        const profile = await profileRes.json();

        // 2. Send profile to matching API to find eligible schemes
        const matchRes = await fetch(`${API_BASE}/schemes/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });

        if (!matchRes.ok) throw new Error('Failed to match schemes');

        const matchedSchemes = await matchRes.json();
        setSchemes(matchedSchemes);

        // Calculate stats
        const highMatch = matchedSchemes.filter(s => s.match_score >= 80).length;
        const avgScore = matchedSchemes.length > 0
          ? Math.round(matchedSchemes.reduce((sum, s) => sum + s.match_score, 0) / matchedSchemes.length)
          : 0;
        setMatchStats({ total: matchedSchemes.length, highMatch, avgScore });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load schemes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleSchemes();
  }, [user]);

  const filtered = useMemo(() => {
    let result = schemes;
    if (activeFilter !== 'All') {
      result = result.filter((s) => s.scheme_type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.benefits && s.benefits.toLowerCase().includes(q)) ||
          (s.ministry && s.ministry.toLowerCase().includes(q))
      );
    }
    return result;
  }, [schemes, activeFilter, searchQuery]);

  const ttsText = useMemo(
    () =>
      filtered.length > 0
        ? `You are eligible for ${filtered.length} schemes. ${filtered.map((s, i) => `Scheme ${i + 1}: ${s.name}. Benefits: ${s.benefits}`).join('. ')}`
        : 'No eligible schemes found.',
    [filtered]
  );

  // ═══ SKELETON LOADING STATE ═══
  if (loading) {
    return (
      <div className="dashboard-container" role="main" aria-label="Loading Dashboard">
        <header className="page-header">
          <h1 className="page-title">
            <div className="skeleton-inline skeleton-pulse" style={{ width: 200, height: 32, borderRadius: 8 }} />
          </h1>
        </header>

        <SkeletonSummary />

        <div className="dashboard-controls card-static">
          <div className="skeleton-search skeleton-pulse" />
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-chip skeleton-pulse" />
            ))}
          </div>
        </div>

        <div className="dashboard-content mt-6">
          <div className="schemes-grid grid grid-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`stagger-${i} animate-slide-up`} style={{ animationFillMode: 'both' }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error === 'profile_incomplete') {
    return (
      <div className="dashboard-container">
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden="true">📋</div>
          <h2 className="empty-state-title">Complete Your Profile First</h2>
          <p className="empty-state-text">Please fill out your profile so we can find matching government schemes for you from our database.</p>
          <a href="/profile" className="btn btn-primary btn-lg mt-4">Complete Profile</a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden="true">⚠️</div>
          <h2 className="empty-state-title">Something went wrong</h2>
          <p className="empty-state-text">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" role="main" aria-label="Eligible Schemes Dashboard">

      {/* Dashboard Header */}
      <header className="page-header">
        <h1 className="page-title">
          Your Eligible Schemes
          {schemes.length > 0 && (
            <span className="count-badge" aria-label={`${schemes.length} schemes found`}>
              {schemes.length}
            </span>
          )}
        </h1>
        <div className="header-actions">
          {/* {!isAdmin && (
            <a href="/profile" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
              ✏️ Update Profile
            </a>
          )} */}
          <button
            className={`btn btn-outline ${showTTS ? 'active' : ''}`}
            onClick={() => setShowTTS(!showTTS)}
            aria-label="Toggle text to speech"
          >
            <FiVolume2 size={18} />
            {showTTS ? 'Hide TTS' : 'Read Aloud'}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards grid grid-3">
        <div className="card summary-card">
          <div className="summary-icon-wrapper blue">
            <FiTrendingUp size={24} />
          </div>
          <div className="summary-info">
            <h3>{matchStats.total}</h3>
            <p>Schemes Matched</p>
          </div>
        </div>
        <div className="card summary-card">
          <div className="summary-icon-wrapper green">
            <FiCheckCircle size={24} />
          </div>
          <div className="summary-info">
            <h3>{matchStats.highMatch}</h3>
            <p>High Match (≥80%)</p>
          </div>
        </div>
        <div className="card summary-card">
          <div className="summary-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <FiPercent size={24} />
          </div>
          <div className="summary-info">
            <h3>{matchStats.avgScore}%</h3>
            <p>Avg Match Score</p>
          </div>
        </div>
      </div>

      {showTTS && (
        <div className="tts-panel card animate-slide-up">
          <TextToSpeech text={ttsText} />
        </div>
      )}

      {/* Filters and Search */}
      <div className="dashboard-controls card-static">
        <div className="search-bar">
          <FiSearch className="search-bar-icon" size={18} aria-hidden="true" />
          <input
            type="search"
            className="input-field"
            placeholder="Search schemes by name, benefits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search eligible schemes"
          />
        </div>

        <div className="filter-scroll" role="tablist" aria-label="Filter by scheme type">
          {SCHEME_TYPES.map((type) => (
            <button
              key={type}
              className={`filter-chip ${activeFilter === type ? 'active' : ''}`}
              onClick={() => setActiveFilter(type)}
              role="tab"
              aria-selected={activeFilter === type}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes List */}
      <div className="dashboard-content mt-6">
        {filtered.length === 0 ? (
          <div className="empty-state card animate-fade-in">
            <div className="empty-state-icon" aria-hidden="true">
              <FiInbox size={48} />
            </div>
            <h2 className="empty-state-title">No Schemes Found</h2>
            <p className="empty-state-text">
              {schemes.length === 0
                ? "Based on your profile, we couldn't find matching active schemes right now. The admin may add new schemes — check back soon!"
                : 'No schemes match your current filter. Try adjusting your search or filter.'}
            </p>
            {schemes.length === 0 && (
              <a href="/profile" className="btn btn-primary mt-4">Update Your Profile</a>
            )}
          </div>
        ) : (
          <div className="schemes-grid grid grid-2" role="list" aria-label="List of eligible schemes">
            {filtered.map((scheme, index) => (
              <div key={scheme.id} role="listitem" className={`stagger-${(index % 6) + 1} animate-slide-up`} style={{ animationFillMode: 'both' }}>
                <SchemeCard scheme={scheme} showMatchScore />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
