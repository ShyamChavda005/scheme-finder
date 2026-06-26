import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiAward, FiFileText, FiTarget } from 'react-icons/fi';
import './SchemeCard.css';

const TYPE_COLORS = {
  Scholarship: 'badge-primary',
  Pension: 'badge-secondary',
  'Assistive Device': 'badge-accent',
  Employment: 'badge-success',
  'Skill Training': 'badge-warning',
  'Financial Assistance': 'badge-primary',
  Other: 'badge-secondary',
};

function getDaysRemaining(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getMatchColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function SchemeCard({ scheme, style, showMatchScore }) {
  const navigate = useNavigate();
  const daysLeft = getDaysRemaining(scheme.last_date);
  const badgeClass = TYPE_COLORS[scheme.scheme_type] || 'badge-primary';

  return (
    <article
      className="scheme-card card"
      style={style}
      onClick={() => navigate(`/scheme/${scheme.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/scheme/${scheme.id}`); }}
      tabIndex={0}
      role="link"
      aria-label={`View details for ${scheme.name}`}
      id={`scheme-card-${scheme.id}`}
    >
      <div className="scheme-card-icon-bg">
        <FiAward size={48} className="bg-icon" />
      </div>

      <div className="scheme-card-content">
        <div className="scheme-card-header">
          <span className={`badge ${badgeClass}`}>{scheme.scheme_type || 'Scheme'}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {showMatchScore && scheme.match_score !== undefined && (
              <span
                className="match-score-badge"
                style={{ 
                  background: `${getMatchColor(scheme.match_score)}18`,
                  color: getMatchColor(scheme.match_score),
                  border: `1px solid ${getMatchColor(scheme.match_score)}30`
                }}
                title={`Match score: ${scheme.match_score}%`}
              >
                <FiTarget size={11} />
                {scheme.match_score}%
              </span>
            )}
            {daysLeft !== null && daysLeft >= 0 && (
              <span className={`scheme-deadline ${daysLeft <= 7 ? 'deadline-urgent' : ''}`}>
                <FiCalendar size={12} aria-hidden="true" />
                {daysLeft === 0 ? 'Last day!' : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>

        <h3 className="scheme-card-title">{scheme.name}</h3>
        
        {scheme.ministry && (
          <p className="scheme-card-ministry">{scheme.ministry}</p>
        )}

        <div className="scheme-card-benefits">
          <div className="benefit-line">
            <FiFileText size={14} className="benefit-icon" />
            <span>{scheme.benefits || 'Financial assistance and support for eligible individuals.'}</span>
          </div>
        </div>

        {/* Match reasons preview */}
        {showMatchScore && scheme.match_reasons && scheme.match_reasons.length > 0 && (
          <div className="match-reasons-preview">
            {scheme.match_reasons.slice(0, 2).map((reason, i) => (
              <span key={i} className="match-reason-chip">✓ {reason}</span>
            ))}
            {scheme.match_reasons.length > 2 && (
              <span className="match-reason-more">+{scheme.match_reasons.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      <div className="scheme-card-footer">
        <span className="scheme-card-link">
          View Details
          <div className="link-arrow">
            <FiArrowRight size={14} aria-hidden="true" />
          </div>
        </span>
      </div>
    </article>
  );
}
