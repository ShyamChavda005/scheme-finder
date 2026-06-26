import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUser, FiMapPin, FiHeart, FiBook, FiCheck, FiArrowRight, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import SchemeCard from '../components/SchemeCard';
import './UserProfile.css';

const API_BASE = 'http://localhost:5000/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const DISABILITY_TYPES = [
  'Locomotor', 'Visual', 'Hearing', 'Intellectual', 'Mental Illness', 'Multiple Disabilities',
];

const EDUCATION_LEVELS = [
  'Pre-Primary', 'Primary', 'Secondary', 'Higher Secondary', 'Graduate', 'Post-Graduate',
];

const CATEGORIES = ['General', 'SC', 'ST', 'OBC'];
const GENDERS = ['Male', 'Female', 'Other'];

const INITIAL_FORM_STATE = {
  full_name: '',
  age: '',
  gender: '',
  has_disability: false,
  disability_type: '',
  state: '',
  district: '',
  category: '',
  family_income: '',
  education_level: '',
  udid_number: '',
};

export default function SchemeFinder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [results, setResults] = useState(null);

  const completedSections = () => {
    let count = 0;
    if (formData.full_name && formData.age && formData.gender) count++;
    if (formData.has_disability !== undefined) count++;
    if (formData.state && formData.district) count++;
    if (formData.category) count++;
    if (formData.education_level) count++;
    return count;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'has_disability' && !checked ? { disability_type: '', udid_number: '' } : {}),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.age || formData.age < 1 || formData.age > 120) errs.age = 'Valid age required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.state) errs.state = 'State is required';
    if (!formData.district.trim()) errs.district = 'District/City is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.education_level) errs.education_level = 'Education level is required';
    if (formData.has_disability && !formData.disability_type) errs.disability_type = 'Select disability type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill all required fields.');
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const payload = {
        username: user?.username,
        full_name: formData.full_name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        has_disability: formData.has_disability,
        disability_type: formData.disability_type || null,
        disability_percentage: 0,
        state: formData.state,
        district: formData.district,
        category: formData.category,
        family_income: formData.family_income ? parseFloat(formData.family_income) : null,
        education_level: formData.education_level,
        udid_number: formData.udid_number || null,
      };

      // Save profile if logged in
      if (user?.username) {
        await fetch(`${API_BASE}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Failed to save profile:', err));
      }

      const matchRes = await fetch(`${API_BASE}/schemes/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!matchRes.ok) throw new Error('Failed to find schemes');

      const matchedSchemes = await matchRes.json();
      setResults(matchedSchemes);
      setFormData(INITIAL_FORM_STATE); // Clear form fields
      setErrors({});
      
      toast.success(`Found ${matchedSchemes.length} matching schemes!`);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error('Scheme finder error:', err);
      toast.error('Failed to find schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = completedSections();

  return (
    <main id="main-content" className="eligibility-page">
      <div className="container">
        <div className="eligibility-header animate-fade-in">
          <h1 className="page-title">Find Schemes Instantly</h1>
          <p className="eligibility-subtitle">
            Enter details below to instantly check eligibility against active government schemes. Form clears after submission so you can check again!
          </p>
        </div>

        <div className="eligibility-progress animate-fade-in">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress / 5) * 100}%` }} />
          </div>
          <span className="progress-label">{progress} of 5 sections completed</span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="eligibility-form">
          {/* PERSONAL INFO */}
          <section className="form-section card-static animate-slide-up">
            <div className="section-header">
              <div className="section-icon-wrapper"><FiUser size={20} /></div>
              <div>
                <h2 className="section-title">Personal Information</h2>
                <p className="section-desc">Basic details about the applicant</p>
              </div>
              {formData.full_name && formData.age && formData.gender && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label>Full Name *</label>
                <input name="full_name" type="text" className={`input-field ${errors.full_name ? 'error' : ''}`} placeholder="Applicant name" value={formData.full_name} onChange={handleChange} />
                {errors.full_name && <span className="input-error-text">{errors.full_name}</span>}
              </div>
              <div className="fields-row">
                <div className="input-group">
                  <label>Age *</label>
                  <input name="age" type="number" min="1" max="120" className={`input-field ${errors.age ? 'error' : ''}`} placeholder="Age" value={formData.age} onChange={handleChange} />
                  {errors.age && <span className="input-error-text">{errors.age}</span>}
                </div>
                <div className="input-group">
                  <label>Gender *</label>
                  <select name="gender" className={`select-field ${errors.gender ? 'error' : ''}`} value={formData.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gender && <span className="input-error-text">{errors.gender}</span>}
                </div>
              </div>
            </div>
          </section>

          {/* DISABILITY DETAILS */}
          <section className="form-section card-static animate-slide-up stagger-1">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-rose"><FiHeart size={20} /></div>
              <div>
                <h2 className="section-title">Disability Details</h2>
                <p className="section-desc">Helps find disability-specific schemes</p>
              </div>
              <FiCheck className="section-check" size={20} />
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label className="disability-toggle-label">
                  <input type="checkbox" name="has_disability" checked={formData.has_disability} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--color-primary-raw)' }} />
                  <span style={{ marginLeft: 8 }}>Applicant has a disability (PwD)</span>
                </label>
              </div>
              {formData.has_disability && (
                <div className="input-group">
                  <label>Disability Type *</label>
                  <select name="disability_type" className={`select-field ${errors.disability_type ? 'error' : ''}`} value={formData.disability_type} onChange={handleChange}>
                    <option value="">Select type</option>
                    {DISABILITY_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.disability_type && <span className="input-error-text">{errors.disability_type}</span>}
                </div>
              )}
            </div>
          </section>

          {/* LOCATION */}
          <section className="form-section card-static animate-slide-up stagger-2">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-emerald"><FiMapPin size={20} /></div>
              <div>
                <h2 className="section-title">Location</h2>
                <p className="section-desc">State and district of residence</p>
              </div>
              {formData.state && formData.district && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields fields-row">
              <div className="input-group">
                <label>State / UT *</label>
                <select name="state" className={`select-field ${errors.state ? 'error' : ''}`} value={formData.state} onChange={handleChange}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <span className="input-error-text">{errors.state}</span>}
              </div>
              <div className="input-group">
                <label>District / City *</label>
                <input name="district" type="text" className={`input-field ${errors.district ? 'error' : ''}`} placeholder="e.g. Mumbai" value={formData.district} onChange={handleChange} />
                {errors.district && <span className="input-error-text">{errors.district}</span>}
              </div>
            </div>
          </section>

          {/* SOCIAL & ECONOMIC */}
          <section className="form-section card-static animate-slide-up stagger-3">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-amber"><FiShield size={20} /></div>
              <div>
                <h2 className="section-title">Social & Economic</h2>
                <p className="section-desc">Category and income details</p>
              </div>
              {formData.category && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields fields-row">
              <div className="input-group">
                <label>Category *</label>
                <select name="category" className={`select-field ${errors.category ? 'error' : ''}`} value={formData.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="input-error-text">{errors.category}</span>}
              </div>
              <div className="input-group">
                <label>Annual Family Income (₹)</label>
                <input name="family_income" type="number" min="0" className="input-field" placeholder="e.g. 250000" value={formData.family_income} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* EDUCATION */}
          <section className="form-section card-static animate-slide-up stagger-4">
            <div className="section-header">
              <div className="section-icon-wrapper section-icon-blue"><FiBook size={20} /></div>
              <div>
                <h2 className="section-title">Education</h2>
                <p className="section-desc">Education level</p>
              </div>
              {formData.education_level && <FiCheck className="section-check" size={20} />}
            </div>
            <div className="section-fields">
              <div className="input-group">
                <label>Education Level *</label>
                <select name="education_level" className={`select-field ${errors.education_level ? 'error' : ''}`} value={formData.education_level} onChange={handleChange}>
                  <option value="">Select education level</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {errors.education_level && <span className="input-error-text">{errors.education_level}</span>}
              </div>
            </div>
          </section>

          <div className="form-actions animate-slide-up stagger-5">
            <button type="submit" className="btn btn-primary btn-lg eligibility-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Searching...</>
              ) : (
                <><FiArrowRight size={18} /> Find Schemes Instantly</>
              )}
            </button>
          </div>
        </form>

        {/* RESULTS SECTION */}
        {results && (
          <div id="results-section" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
            <h2 className="page-title" style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>
              Found {results.length} Eligible Scheme{results.length !== 1 ? 's' : ''}
            </h2>
            {results.length === 0 ? (
              <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No active schemes match these details.</p>
              </div>
            ) : (
              <div className="schemes-grid grid grid-2">
                {results.map((scheme, index) => (
                  <div key={scheme.id} className={`stagger-${(index % 6) + 1} animate-slide-up`} style={{ animationFillMode: 'both' }}>
                    <SchemeCard scheme={scheme} showMatchScore />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
