import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiCalendar, FiCheckCircle, FiFileText, FiAward, FiTarget, FiUsers, FiDollarSign } from 'react-icons/fi';
import TextToSpeech from '../components/TextToSpeech';
import './SchemeDetail.css';

const API_BASE = 'http://localhost:5000/api';

function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ═══ SKELETON FOR DETAIL PAGE ═══
function DetailSkeleton() {
  return (
    <div className="scheme-detail-container container" role="main">
      <div className="breadcrumb">
        <div className="skeleton-pulse" style={{ width: 80, height: 20, borderRadius: 6 }} />
        <span className="breadcrumb-sep">/</span>
        <div className="skeleton-pulse" style={{ width: 200, height: 20, borderRadius: 6 }} />
      </div>
      <article className="scheme-detail">
        <header className="scheme-detail-header">
          <div className="scheme-header-top">
            <div className="skeleton-pulse" style={{ width: 100, height: 28, borderRadius: 20 }} />
          </div>
          <div className="skeleton-pulse" style={{ width: '70%', height: 36, borderRadius: 8, marginTop: 12 }} />
          <div className="skeleton-pulse" style={{ width: '40%', height: 20, borderRadius: 6, marginTop: 8 }} />
        </header>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="skeleton-pulse" style={{ width: '100%', height: 16, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-pulse" style={{ width: '90%', height: 16, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-pulse" style={{ width: '75%', height: 16, borderRadius: 6 }} />
        </div>
        <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <div className="skeleton-pulse" style={{ width: '100%', height: 16, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-pulse" style={{ width: '85%', height: 16, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-pulse" style={{ width: '60%', height: 16, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: '1.5rem' }}>
          <div className="skeleton-pulse" style={{ width: 160, height: 48, borderRadius: 10 }} />
          <div className="skeleton-pulse" style={{ width: 160, height: 48, borderRadius: 10 }} />
        </div>
      </article>
    </div>
  );
}

export default function SchemeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTTS, setShowTTS] = useState(false);

  useEffect(() => {
    const fetchScheme = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/schemes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setScheme(data);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch scheme:', err);
        navigate('/dashboard');
      }
      setLoading(false);
    };
    fetchScheme();
  }, [id, navigate]);

  if (loading) return <DetailSkeleton />;
  if (!scheme) return null;

  const daysLeft = getDaysRemaining(scheme.last_date);
  const documents = Array.isArray(scheme.required_documents) ? scheme.required_documents : [];
  const eligibility = scheme.eligibility || {};
  const ttsText = `${scheme.name}. Benefits: ${scheme.benefits}. Ministry: ${scheme.ministry}. ${documents.length > 0 ? `Required documents: ${documents.join(', ')}` : ''}`;

  return (
    <div className="scheme-detail-container container" role="main">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
          <FiArrowLeft size={20} /> Back
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{scheme.name}</span>
      </nav>

      <article className="scheme-detail animate-fade-in">
        <header className="scheme-detail-header">
          <div className="scheme-header-top">
            <span className="badge badge-primary">{scheme.scheme_type || 'Scheme'}</span>
            {scheme.match_score !== undefined && (
              <span className="match-score-detail" style={{ color: scheme.match_score >= 80 ? '#10b981' : scheme.match_score >= 60 ? '#f59e0b' : '#ef4444' }}>
                <FiTarget size={16} /> {scheme.match_score}% Match
              </span>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <span className={`deadline-badge ${daysLeft <= 7 ? 'deadline-urgent' : 'deadline-normal'}`}>
                <FiCalendar size={14} />
                {daysLeft === 0 ? 'Last day to apply!' : `${daysLeft} days remaining`}
              </span>
            )}
          </div>
          <h1 className="scheme-detail-title">{scheme.name}</h1>
          <p className="scheme-detail-ministry">
            <FiAward size={16} aria-hidden="true" />
            {scheme.ministry || 'Government of India'}
          </p>
        </header>

        <button
          className="btn btn-outline tts-btn"
          onClick={() => setShowTTS(!showTTS)}
          aria-label="Toggle text to speech for scheme details"
          id="scheme-tts-toggle"
        >
          🔊 {showTTS ? 'Hide Reader' : 'Read Aloud'}
        </button>

        {showTTS && (
          <div className="tts-section card animate-slide-up">
            <TextToSpeech text={ttsText} />
          </div>
        )}

        <section className="benefits-card card" aria-label="Scheme benefits">
          <h2 className="section-title">
            <FiAward size={20} aria-hidden="true" />
            Benefits
          </h2>
          <p className="benefits-text">{scheme.benefits}</p>
        </section>

        {scheme.description && (
          <section className="description-section" aria-label="Scheme description">
            <h2 className="section-title">
              <FiFileText size={20} aria-hidden="true" />
              Description
            </h2>
            <p className="description-text">{scheme.description}</p>
          </section>
        )}

        {/* ═══ ELIGIBILITY CRITERIA ═══ */}
        {Object.keys(eligibility).length > 0 && (
          <section className="eligibility-criteria-section card" aria-label="Eligibility criteria">
            <h2 className="section-title">
              <FiUsers size={20} aria-hidden="true" />
              Eligibility Criteria
            </h2>
            <div className="criteria-grid">
              {eligibility.min_age && (
                <div className="criteria-item">
                  <span className="criteria-label">Min Age</span>
                  <span className="criteria-value">{eligibility.min_age} years</span>
                </div>
              )}
              {eligibility.max_age && (
                <div className="criteria-item">
                  <span className="criteria-label">Max Age</span>
                  <span className="criteria-value">{eligibility.max_age} years</span>
                </div>
              )}
              {eligibility.gender && (
                <div className="criteria-item">
                  <span className="criteria-label">Gender</span>
                  <span className="criteria-value">{eligibility.gender}</span>
                </div>
              )}
              {eligibility.categories && eligibility.categories.length > 0 && (
                <div className="criteria-item">
                  <span className="criteria-label">Categories</span>
                  <span className="criteria-value">{eligibility.categories.join(', ')}</span>
                </div>
              )}
              {eligibility.max_family_income && (
                <div className="criteria-item">
                  <span className="criteria-label">Max Income</span>
                  <span className="criteria-value">₹{Number(eligibility.max_family_income).toLocaleString('en-IN')}</span>
                </div>
              )}
              {eligibility.education_levels && eligibility.education_levels.length > 0 && (
                <div className="criteria-item">
                  <span className="criteria-label">Education</span>
                  <span className="criteria-value">{eligibility.education_levels.join(', ')}</span>
                </div>
              )}
              {eligibility.disability_types && eligibility.disability_types.length > 0 && (
                <div className="criteria-item">
                  <span className="criteria-label">Disability Types</span>
                  <span className="criteria-value">{eligibility.disability_types.join(', ')}</span>
                </div>
              )}
              {eligibility.min_disability_pct && (
                <div className="criteria-item">
                  <span className="criteria-label">Min Disability %</span>
                  <span className="criteria-value">{eligibility.min_disability_pct}%</span>
                </div>
              )}
              {eligibility.states && eligibility.states.length > 0 && (
                <div className="criteria-item">
                  <span className="criteria-label">States</span>
                  <span className="criteria-value">{eligibility.states.join(', ')}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Match reasons */}
        {scheme.match_reasons && scheme.match_reasons.length > 0 && (
          <section className="match-reasons-section card" aria-label="Match reasons">
            <h2 className="section-title">
              <FiCheckCircle size={20} aria-hidden="true" />
              Why You're Eligible
            </h2>
            <ul className="match-reasons-list">
              {scheme.match_reasons.map((reason, i) => (
                <li key={i} className="match-reason-item">
                  <FiCheckCircle size={16} className="reason-icon" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {documents.length > 0 && (
          <section className="documents-section" aria-label="Required documents">
            <h2 className="section-title">
              <FiCheckCircle size={20} aria-hidden="true" />
              Required Documents
            </h2>
            <ul className="documents-list">
              {documents.map((doc, index) => (
                <li key={index} className="document-item">
                  <FiCheckCircle size={16} className="doc-icon" aria-hidden="true" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {scheme.last_date && (
          <section className="date-section" aria-label="Application deadline">
            <h2 className="section-title">
              <FiCalendar size={20} aria-hidden="true" />
              Application Deadline
            </h2>
            <p className="date-text">
              {new Date(scheme.last_date).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
              {daysLeft !== null && daysLeft >= 0 && (
                <span className={`days-badge ${daysLeft <= 7 ? 'deadline-urgent' : ''}`}>
                  {daysLeft === 0 ? 'Today is the last day!' : `${daysLeft} days left`}
                </span>
              )}
            </p>
          </section>
        )}

        <div className="scheme-actions">
          {scheme.apply_link && (
            <a
              href={scheme.apply_link.startsWith('http') ? scheme.apply_link : `https://${scheme.apply_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg apply-btn"
              id="apply-now-btn"
            >
              <FiExternalLink size={18} />
              Apply Now
            </a>
          )}
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {scheme.source_url && (
          <p className="source-info">
            Source:{' '}
            <a href={scheme.source_url.startsWith('http') ? scheme.source_url : `https://${scheme.source_url}`} target="_blank" rel="noopener noreferrer">
              {scheme.source_url}
            </a>
          </p>
        )}
      </article>
    </div>
  );
}
