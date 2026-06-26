import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SchemeFinder from './pages/SchemeFinder';
import UserProfile from './pages/UserProfile';
import Dashboard from './pages/Dashboard';
import SchemeDetail from './pages/SchemeDetail';
import MyEligibility from './pages/MyEligibility';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSchemes from './pages/admin/ManageSchemes';
import ScraperStatus from './pages/admin/ScraperStatus';
import ViewUsers from './pages/admin/ViewUsers';
import AddSchemes from './pages/admin/AddSchemes';
import ActiveSchemes from './pages/admin/ActiveSchemes';
import AIAssistant from './pages/admin/AIAssistant';
import ReviewSchemes from './pages/admin/ReviewSchemes';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/finder" element={<ProtectedRoute><SchemeFinder /></ProtectedRoute>} />
        <Route path="/my-eligibility" element={<ProtectedRoute><MyEligibility /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scheme/:id" element={<ProtectedRoute><SchemeDetail /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/schemes" element={<ProtectedRoute adminOnly><ManageSchemes /></ProtectedRoute>} />
        <Route path="/admin/scraper" element={<ProtectedRoute adminOnly><ScraperStatus /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><ViewUsers /></ProtectedRoute>} />
        <Route path="/admin/add-scheme" element={<ProtectedRoute adminOnly><AddSchemes /></ProtectedRoute>} />
        <Route path="/admin/active-schemes" element={<ProtectedRoute adminOnly><ActiveSchemes /></ProtectedRoute>} />
        <Route path="/admin/ai-assistant" element={<ProtectedRoute adminOnly><AIAssistant /></ProtectedRoute>} />
        <Route path="/admin/review" element={<ProtectedRoute adminOnly><ReviewSchemes /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}
