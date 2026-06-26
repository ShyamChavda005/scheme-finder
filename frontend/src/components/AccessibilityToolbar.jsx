import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCpu } from 'react-icons/fi';
import './AccessibilityToolbar.css';

export default function AccessibilityToolbar() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleAIClick = () => {
    navigate(isAdmin ? '/admin/ai-assistant' : '/finder');
  };

  return (
    <div className="a11y-toolbar" role="toolbar" aria-label="AI Assistant Quick Link">
      <button
        className="a11y-toggle"
        onClick={handleAIClick}
        aria-label="Open AI Scheme Finder"
        title="AI Scheme Finder"
      >
        <FiCpu size={22} />
      </button>
    </div>
  );
}
