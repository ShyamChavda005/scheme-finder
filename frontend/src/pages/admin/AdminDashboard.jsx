import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDatabase, FiUsers, FiActivity, FiPlusCircle, FiRefreshCw, FiEye, FiCpu } from 'react-icons/fi';
import API from '../../api/axios';
import './Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ schemes: 0, users: 0, lastScrape: null, recentLogs: [], recentUsers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [scraperRes, usersRes, usersListRes] = await Promise.allSettled([
          API.get('/scraper/logs/'),
          fetch('http://localhost:5000/api/users/count').then(r => r.json()),
          fetch('http://localhost:5000/api/users').then(r => r.json())
        ]);

        const logs = scraperRes.status === 'fulfilled' ? (Array.isArray(scraperRes.value.data) ? scraperRes.value.data : scraperRes.value.data.results || []) : [];
        const usersCount = usersRes.status === 'fulfilled' ? usersRes.value.count : 0;
        const recentUsers = usersListRes.status === 'fulfilled' ? usersListRes.value.slice(0, 5) : [];

        setStats({
          users: usersCount,
          lastScrape: logs.length > 0 ? logs[0] : null,
          recentLogs: logs.slice(0, 5),
          recentUsers: recentUsers,
        });
      } catch { /* silently handle */ }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'status-success';
      case 'FAILED': return 'status-error';
      case 'RUNNING': return 'status-warning';
      default: return '';
    }
  };

  return (
    <div className="admin-container container" role="main" aria-label="Admin Dashboard">
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="stats-grid">

        <div className="stat-card card" id="stat-users">
          <div className="stat-icon stat-icon-secondary"><FiUsers size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.users}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="stat-card card" id="stat-scrape">
          <div className="stat-icon stat-icon-accent"><FiActivity size={24} /></div>
          <div className="stat-info">
            <span className={`stat-value ${stats.lastScrape ? getStatusColor(stats.lastScrape.status) : ''}`}>
              {loading ? '...' : stats.lastScrape ? stats.lastScrape.status : 'No runs'}
            </span>
            <span className="stat-label">Last Scrape Status</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="section-heading">Quick Actions</h2>
        <div className="actions-row">
          <button className="btn btn-primary action-btn" onClick={() => navigate('/admin/add-scheme')} id="action-add-scheme">
            <FiPlusCircle size={18} /> Add Schemes
          </button>
          <button className="btn btn-outline action-btn" onClick={() => navigate('/admin/users')} id="action-users">
            <FiEye size={18} /> View Users
          </button>
          <button className="btn action-btn" style={{background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', border: 'none'}} onClick={() => navigate('/admin/ai-assistant')} id="action-ai">
            <FiCpu size={18} /> AI Scheme Finder
          </button>
        </div>
      </div>

      {stats.recentLogs.length > 0 && (
        <div className="recent-section">
          <h2 className="section-heading">Recent Scrape Logs</h2>
          <div className="table-wrapper card">
            <table className="data-table" aria-label="Recent scrape logs">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Found</th>
                  <th>Updated</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.source_name}</td>
                    <td><span className={`status-badge ${getStatusColor(log.status)}`}>{log.status}</span></td>
                    <td>{log.schemes_found}</td>
                    <td>{log.schemes_updated}</td>
                    <td>{new Date(log.started_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECENT USERS SECTION */}
      <div className="card dashboard-card" style={{ marginTop: '2rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Recent Registrations</h2>
          <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/admin/users')}>
            <FiEye size={14} style={{ marginRight: 4 }} /> View All
          </button>
        </div>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Recent Users">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers && stats.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={u.is_suspended === 1 ? 'scheme-inactive' : 'scheme-active'}>
                      {u.is_suspended === 1 ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.recentUsers || stats.recentUsers.length === 0) && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No users registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
