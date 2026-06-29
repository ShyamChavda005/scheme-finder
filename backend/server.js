const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// --- SCHEMES API ---
app.get('/api/schemes', (req, res) => {
  db.all('SELECT * FROM schemes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => {
      let parsedEligibility = {};
      try { parsedEligibility = JSON.parse(r.eligibility); } catch (e) { parsedEligibility = {}; }
      
      let parsedDocs = [];
      try { parsedDocs = JSON.parse(r.required_documents); } catch (e) { parsedDocs = r.required_documents; }

      return {
        ...r,
        is_active: r.is_active === 1,
        eligibility: parsedEligibility,
        required_documents: parsedDocs
      };
    });
    res.json(formatted);
  });
});

// Get a single scheme by ID
app.get('/api/schemes/:id', (req, res) => {
  db.get('SELECT * FROM schemes WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Scheme not found' });

    let parsedEligibility = {};
    try { parsedEligibility = JSON.parse(row.eligibility); } catch (e) { parsedEligibility = {}; }
    let parsedDocs = [];
    try { parsedDocs = JSON.parse(row.required_documents); } catch (e) { parsedDocs = row.required_documents; }

    res.json({
      ...row,
      is_active: row.is_active === 1,
      eligibility: parsedEligibility,
      required_documents: parsedDocs
    });
  });
});

app.post('/api/schemes', (req, res) => {
  const { name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url } = req.body;
  const sql = `INSERT INTO schemes (name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const eligibilityStr = typeof eligibility === 'object' ? JSON.stringify(eligibility) : eligibility;
  const docsStr = typeof required_documents === 'object' ? JSON.stringify(required_documents) : required_documents;

  db.run(sql, [name, description, benefits, docsStr, apply_link, last_date, ministry, scheme_type, is_active ? 1 : 0, eligibilityStr, source_url || ''], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Scheme created successfully' });
  });
});

app.put('/api/schemes/:id/deactivate', (req, res) => {
  db.run('UPDATE schemes SET is_active = 0 WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme deactivated successfully' });
  });
});

app.put('/api/schemes/:id/reactivate', (req, res) => {
  db.run('UPDATE schemes SET is_active = 1 WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme reactivated successfully' });
  });
});

app.put('/api/schemes/:id', (req, res) => {
  const { name, description, benefits, required_documents, apply_link, last_date, ministry, scheme_type, is_active, eligibility, source_url } = req.body;
  const sql = `UPDATE schemes SET name=?, description=?, benefits=?, required_documents=?, apply_link=?, last_date=?, ministry=?, scheme_type=?, is_active=?, eligibility=?, source_url=? WHERE id=?`;
  
  const eligibilityStr = typeof eligibility === 'object' ? JSON.stringify(eligibility) : eligibility;
  const docsStr = typeof required_documents === 'object' ? JSON.stringify(required_documents) : required_documents;

  db.run(sql, [name, description, benefits, docsStr, apply_link, last_date, ministry, scheme_type, is_active ? 1 : 0, eligibilityStr, source_url || '', req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme updated successfully' });
  });
});

app.delete('/api/schemes/:id', (req, res) => {
  db.run('DELETE FROM schemes WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Scheme not found' });
    res.json({ message: 'Scheme deleted permanently' });
  });
});

// --- SCHEME MATCHING API ---
// Accepts user profile data and returns matching active schemes from the DB
app.post('/api/schemes/match', (req, res) => {
  const profile = req.body;

  db.all('SELECT * FROM schemes WHERE is_active = 1 ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const results = [];
    for (const row of rows) {
      let eligibility = {};
      try { eligibility = JSON.parse(row.eligibility); } catch (e) { eligibility = {}; }
      let parsedDocs = [];
      try { parsedDocs = JSON.parse(row.required_documents); } catch (e) { parsedDocs = row.required_documents; }

      const matchResult = matchProfile(profile, eligibility);

      if (matchResult.eligible) {
        results.push({
          ...row,
          is_active: true,
          eligibility,
          required_documents: parsedDocs,
          match_score: matchResult.score,
          match_reasons: matchResult.reasons,
        });
      }
    }

    // Sort by match score descending
    results.sort((a, b) => b.match_score - a.match_score);
    res.json(results);
  });
});

/**
 * Match a user profile against a scheme's eligibility criteria.
 * Returns { eligible: bool, score: number 0-100, reasons: string[] }
 */
function matchProfile(profile, eligibility) {
  const reasons = [];
  let totalChecks = 0;
  let passedChecks = 0;
  let hardFail = false;

  // --- Age check ---
  if (eligibility.min_age && profile.age) {
    totalChecks++;
    if (parseInt(profile.age) >= parseInt(eligibility.min_age)) {
      passedChecks++;
      reasons.push(`Age ${profile.age} ≥ minimum ${eligibility.min_age}`);
    } else {
      hardFail = true;
      reasons.push(`Age ${profile.age} is below minimum ${eligibility.min_age}`);
    }
  }
  if (eligibility.max_age && profile.age) {
    totalChecks++;
    if (parseInt(profile.age) <= parseInt(eligibility.max_age)) {
      passedChecks++;
      reasons.push(`Age ${profile.age} ≤ maximum ${eligibility.max_age}`);
    } else {
      hardFail = true;
      reasons.push(`Age ${profile.age} exceeds maximum ${eligibility.max_age}`);
    }
  }

  // --- Gender check ---
  if (eligibility.gender && profile.gender) {
    totalChecks++;
    const profileGender = profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : profile.gender;
    if (eligibility.gender.toLowerCase() === profileGender.toLowerCase() || eligibility.gender.toLowerCase() === 'any') {
      passedChecks++;
      reasons.push(`Gender matches: ${profileGender}`);
    } else {
      hardFail = true;
      reasons.push(`Gender ${profileGender} doesn't match required ${eligibility.gender}`);
    }
  }

  // --- Category check ---
  if (eligibility.categories && eligibility.categories.length > 0 && profile.category) {
    totalChecks++;
    if (eligibility.categories.includes(profile.category)) {
      passedChecks++;
      reasons.push(`Category ${profile.category} is eligible`);
    } else {
      hardFail = true;
      reasons.push(`Category ${profile.category} not in eligible list: ${eligibility.categories.join(', ')}`);
    }
  }

  // --- Income check ---
  if (eligibility.max_family_income && profile.family_income) {
    totalChecks++;
    if (parseFloat(profile.family_income) <= parseFloat(eligibility.max_family_income)) {
      passedChecks++;
      reasons.push(`Income ₹${profile.family_income} ≤ maximum ₹${eligibility.max_family_income}`);
    } else {
      hardFail = true;
      reasons.push(`Income ₹${profile.family_income} exceeds maximum ₹${eligibility.max_family_income}`);
    }
  }

  // --- Education level check ---
  if (eligibility.education_levels && eligibility.education_levels.length > 0 && profile.education_level) {
    totalChecks++;
    if (eligibility.education_levels.includes(profile.education_level)) {
      passedChecks++;
      reasons.push(`Education level ${profile.education_level} matches`);
    } else {
      // Soft fail — don't hard-fail on education, it could be partial match
      reasons.push(`Education level ${profile.education_level} not specifically listed`);
    }
  }

  // --- State check ---
  if (eligibility.states && eligibility.states.length > 0 && profile.state) {
    totalChecks++;
    if (eligibility.states.includes(profile.state)) {
      passedChecks++;
      reasons.push(`State ${profile.state} is eligible`);
    } else {
      hardFail = true;
      reasons.push(`State ${profile.state} not in eligible list`);
    }
  }

  // --- Disability check ---
  if (eligibility.disability_types && eligibility.disability_types.length > 0) {
    totalChecks++;
    if (profile.has_disability && profile.disability_type) {
      if (eligibility.disability_types.includes(profile.disability_type)) {
        passedChecks++;
        reasons.push(`Disability type ${profile.disability_type} matches`);
      } else {
        reasons.push(`Disability type ${profile.disability_type} not specifically listed`);
      }
    } else {
      // If scheme requires disability but user doesn't have one
      reasons.push('Scheme targets persons with disabilities');
    }
  }

  // --- Disability percentage check ---
  if (eligibility.min_disability_pct && profile.disability_percentage) {
    totalChecks++;
    if (parseInt(profile.disability_percentage) >= parseInt(eligibility.min_disability_pct)) {
      passedChecks++;
      reasons.push(`Disability ${profile.disability_percentage}% ≥ minimum ${eligibility.min_disability_pct}%`);
    } else {
      reasons.push(`Disability ${profile.disability_percentage}% below minimum ${eligibility.min_disability_pct}%`);
    }
  }

  // If no eligibility criteria set, the scheme is open to all
  if (totalChecks === 0) {
    return { eligible: true, score: 75, reasons: ['Open to all eligible citizens'] };
  }

  if (hardFail) {
    return { eligible: false, score: 0, reasons };
  }

  const score = Math.round((passedChecks / totalChecks) * 100);
  return { eligible: score >= 50, score, reasons };
}

// --- USER PROFILE API ---
app.post('/api/profile', (req, res) => {
  const { username, full_name, age, gender, has_disability, disability_type, disability_percentage, state, district, category, family_income, education_level, udid_number } = req.body;

  if (!username || !full_name) {
    return res.status(400).json({ error: 'Username and full name are required' });
  }

  const sql = `INSERT INTO user_profiles (username, full_name, age, gender, has_disability, disability_type, disability_percentage, state, district, category, family_income, education_level, udid_number, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(username) DO UPDATE SET
      full_name=excluded.full_name, age=excluded.age, gender=excluded.gender,
      has_disability=excluded.has_disability, disability_type=excluded.disability_type,
      disability_percentage=excluded.disability_percentage, state=excluded.state,
      district=excluded.district, category=excluded.category,
      family_income=excluded.family_income, education_level=excluded.education_level,
      udid_number=excluded.udid_number, updated_at=CURRENT_TIMESTAMP`;

  db.run(sql, [username, full_name, age, gender, has_disability ? 1 : 0, disability_type || null, disability_percentage || 0, state, district, category, family_income || null, education_level, udid_number || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile saved successfully', id: this.lastID || this.changes });
  });
});

app.get('/api/profile/:username', (req, res) => {
  const username = req.params.username;
  db.get('SELECT username, email, password, full_name FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    if (admin) {
      return res.json({
        username: admin.username,
        email: admin.email || '',
        full_name: admin.full_name || 'Admin',
        password: admin.password
      });
    }

    db.get('SELECT u.username, u.email, u.password, p.full_name FROM users u LEFT JOIN user_profiles p ON u.username = p.username WHERE u.username = ?', [username], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'Profile not found' });
      res.json(user);
    });
  });
});

// --- REVIEW QUEUE API ---
app.get('/api/review', (req, res) => {
  db.all('SELECT * FROM review_queue ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/review', (req, res) => {
  const { headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal } = req.body;
  const sql = `INSERT INTO review_queue (headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [headline, content, name, source_url, source_name, ai_confidence, ai_reason, verification_status, official_portal], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body });
  });
});

app.delete('/api/review/:id', (req, res) => {
  db.run('DELETE FROM review_queue WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- AUTH API ---
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });

  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username or Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User registered successfully', userId: this.lastID, role: 'user' });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Check admin first
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    if (admin) {
      return res.json({ token: 'mock-admin-token-123', role: 'admin', user: { username } });
    }

    // Check user
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (user) {
        if (user.is_suspended === 1) {
          return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
        }
        return res.json({ token: 'mock-user-token-123', role: 'user', user: { username, email: user.email } });
      }
      res.status(401).json({ error: 'Invalid username or password' });
    });
  });
});

// --- USERS API ---
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, is_suspended, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/users/count', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ count: row.count });
  });
});

app.put('/api/users/:id/suspend', (req, res) => {
  const { suspend } = req.body;
  db.run('UPDATE users SET is_suspended = ? WHERE id = ?', [suspend ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `User ${suspend ? 'suspended' : 'activated'} successfully` });
  });
});

app.put('/api/users/update', (req, res) => {
  const { currentUsername, username, email, password, full_name } = req.body;
  
  if (!currentUsername || !username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Check if admin
  db.get('SELECT * FROM admins WHERE username = ?', [currentUsername], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (admin) {
      let adminSql = 'UPDATE admins SET username = ?, email = ?, full_name = ?';
      let adminParams = [username, email || '', full_name || ''];
      if (password) {
        adminSql += ', password = ?';
        adminParams.push(password);
      }
      adminSql += ' WHERE username = ?';
      adminParams.push(currentUsername);

      db.run(adminSql, adminParams, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Admin profile updated successfully', newUsername: username, newEmail: email || '' });
      });
    } else {
      if (!email) return res.status(400).json({ error: 'Email is required' });

      // Check if new username or email already exists (if changing)
      db.get('SELECT * FROM users WHERE (username = ? OR email = ?) AND username != ?', [username, email, currentUsername], (err, existingUser) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existingUser) return res.status(400).json({ error: 'Username or Email already taken' });

        // Update users table
        let userSql = 'UPDATE users SET username = ?, email = ?';
        let userParams = [username, email];
        
        if (password) {
          userSql += ', password = ?';
          userParams.push(password);
        }
        userSql += ' WHERE username = ?';
        userParams.push(currentUsername);

        db.run(userSql, userParams, function(err) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

          // Update user_profiles table (username and full_name)
          db.run('UPDATE user_profiles SET username = ?, full_name = ? WHERE username = ?', [username, full_name || '', currentUsername], function(errProfile) {
            res.json({ message: 'Profile updated successfully', newUsername: username, newEmail: email });
          });
        });
      });
    }
  });
});

// =====================================================
// AI ASSISTANT — PROXY ENDPOINTS
// These proxy GNews + AI calls to avoid browser CORS issues
// =====================================================

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// --- Fetch news articles ---
app.get('/api/ai/news', async (req, res) => {
  const QUERY_POOL = [
    'India government scheme launched',
    'India new yojana subsidy announced',
    'India scholarship welfare program',
    'pradhan mantri new scheme benefit',
    'India government benefit registration',
    'central government yojana eligibility',
    'India ministry scheme announcement',
    'state government new scheme subsidy',
    'India financial assistance program',
    'India pension scheme welfare update',
    'India farmers scheme kisan yojana',
    'India women empowerment scheme benefit',
    'India housing scheme loan subsidy',
    'India healthcare scheme insurance',
    'India education scholarship grant',
  ];

  // Pick 3 random queries
  const shuffled = [...QUERY_POOL].sort(() => Math.random() - 0.5);
  const queries = shuffled.slice(0, 3);

  const allArticles = [];

  for (const q of queries) {
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=in&max=10&apikey=${GNEWS_API_KEY}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        console.warn(`[AI News] GNews returned ${response.status} for: "${q}"`);
        continue;
      }
      const data = await response.json();
      if (data.articles) {
        for (const a of data.articles) {
          allArticles.push({
            title: a.title,
            content: a.description || a.content || '',
            url: a.url,
            source: a.source?.name || 'Unknown',
            publishedAt: a.publishedAt,
            image: a.image,
          });
        }
      }
    } catch (err) {
      console.warn(`[AI News] GNews fetch failed for: "${q}"`, err.message);
    }
  }

  // De-duplicate by URL
  const seen = new Set();
  const unique = allArticles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  // Sort newest first
  unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  if (unique.length > 0) {
    console.log(`[AI News] Fetched ${unique.length} unique articles from GNews`);
    return res.json({ source: 'gnews', articles: unique });
  }

  // Fallback: PIB RSS
  try {
    const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://pib.gov.in/RssFeed.aspx?MenuId=2&Lang=1&RegDtFrom=&RegDtTo=')}&_cb=${Date.now()}`;
    const rssRes = await fetch(rssUrl, { signal: AbortSignal.timeout(5000) });
    if (rssRes.ok) {
      const rssData = await rssRes.json();
      if (rssData.items && rssData.items.length > 0) {
        const articles = rssData.items.slice(0, 10).map((item) => ({
          title: item.title,
          content: (item.description || item.content || '').replace(/<[^>]*>/g, ''),
          url: item.link,
          source: 'PIB India (Press Information Bureau)',
          publishedAt: item.pubDate,
          image: item.thumbnail || null,
        }));
        console.log(`[AI News] Fetched ${articles.length} articles from PIB RSS`);
        return res.json({ source: 'pib_rss', articles });
      }
    }
  } catch (err) {
    console.warn('[AI News] PIB RSS failed:', err.message);
  }

  console.warn('[AI News] All sources failed, returning empty');
  res.json({ source: 'none', articles: [] });
});

// --- AI Analysis of a headline ---
app.post('/api/ai/analyze', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) {
          return res.json({ source: 'gemini', text: rawText });
        }
      } else {
        console.warn(`[AI Analyze] Gemini returned ${geminiRes.status}`);
      }
    } catch (err) {
      console.warn('[AI Analyze] Gemini failed:', err.message);
    }
  }

  // Try OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (orRes.ok) {
        const data = await orRes.json();
        const rawText = data?.choices?.[0]?.message?.content || '';
        if (rawText) {
          return res.json({ source: 'openrouter', text: rawText });
        }
      } else {
        console.warn(`[AI Analyze] OpenRouter returned ${orRes.status}`);
      }
    } catch (err) {
      console.warn('[AI Analyze] OpenRouter failed:', err.message);
    }
  }

  // Both failed
  console.warn('[AI Analyze] All AI providers failed');
  res.json({ source: 'none', text: '' });
});

// =====================================================
// SCRAPER LOGS API
// =====================================================

app.get('/api/scraper/logs', (req, res) => {
  db.all('SELECT * FROM scraper_logs ORDER BY started_at DESC LIMIT 20', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/scraper/trigger', (req, res) => {
  // Mocking a scraper trigger event
  const sources = ['MyScheme.gov.in', 'India.gov.in', 'PIB.gov.in', 'National Scholarship Portal'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const found = Math.floor(Math.random() * 10);
  const updated = Math.floor(Math.random() * 5);
  const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const errMsg = status === 'FAILED' ? 'Connection timeout' : null;

  db.run(
    'INSERT INTO scraper_logs (source_name, status, schemes_found, schemes_updated, error_message, completed_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [source, status, found, updated, errMsg],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Scrape job completed successfully', logId: this.lastID });
    }
  );
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
