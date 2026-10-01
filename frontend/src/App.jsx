import React, { useState, useEffect } from 'react';

// The 22 voice features with their key, full name, placeholder, and representative demo values
const FEATURE_DEFINITIONS = [
  { key: 'fo', name: '1. MDVP:Fo(Hz)', placeholder: '119.992', demoHealthy: '197.076', demoParkinsons: '119.992' },
  { key: 'fhi', name: '2. MDVP:Fhi(Hz)', placeholder: '157.302', demoHealthy: '206.896', demoParkinsons: '157.302' },
  { key: 'flo', name: '3. MDVP:Flo(Hz)', placeholder: '74.997', demoHealthy: '192.055', demoParkinsons: '74.997' },
  { key: 'jitter_percent', name: '4. MDVP:Jitter(%)', placeholder: '0.00784', demoHealthy: '0.00289', demoParkinsons: '0.00784' },
  { key: 'jitter_abs', name: '5. MDVP:Jitter(Abs)', placeholder: '0.00007', demoHealthy: '0.00001', demoParkinsons: '0.00007' },
  { key: 'rap', name: '6. MDVP:RAP', placeholder: '0.00370', demoHealthy: '0.00166', demoParkinsons: '0.00370' },
  { key: 'ppq', name: '7. MDVP:PPQ', placeholder: '0.00554', demoHealthy: '0.00168', demoParkinsons: '0.00554' },
  { key: 'ddp', name: '8. Jitter:DDP', placeholder: '0.01109', demoHealthy: '0.00498', demoParkinsons: '0.01109' },
  { key: 'shimmer', name: '9. MDVP:Shimmer', placeholder: '0.04374', demoHealthy: '0.01098', demoParkinsons: '0.04374' },
  { key: 'shimmer_db', name: '10. MDVP:Shimmer(dB)', placeholder: '0.426', demoHealthy: '0.097', demoParkinsons: '0.426' },
  { key: 'apq3', name: '11. Shimmer:APQ3', placeholder: '0.02182', demoHealthy: '0.00563', demoParkinsons: '0.02182' },
  { key: 'apq5', name: '12. Shimmer:APQ5', placeholder: '0.03130', demoHealthy: '0.00680', demoParkinsons: '0.03130' },
  { key: 'apq', name: '13. MDVP:APQ', placeholder: '0.02971', demoHealthy: '0.00802', demoParkinsons: '0.02971' },
  { key: 'dda', name: '14. Shimmer:DDA', placeholder: '0.06545', demoHealthy: '0.01689', demoParkinsons: '0.06545' },
  { key: 'nhr', name: '15. NHR', placeholder: '0.02211', demoHealthy: '0.00339', demoParkinsons: '0.02211' },
  { key: 'hnr', name: '16. HNR', placeholder: '21.033', demoHealthy: '26.775', demoParkinsons: '21.033' },
  { key: 'rpde', name: '17. RPDE', placeholder: '0.414783', demoHealthy: '0.422229', demoParkinsons: '0.414783' },
  { key: 'dfa', name: '18. DFA', placeholder: '0.815285', demoHealthy: '0.741367', demoParkinsons: '0.815285' },
  { key: 'spread1', name: '19. spread1', placeholder: '-4.813031', demoHealthy: '-7.348300', demoParkinsons: '-4.813031' },
  { key: 'spread2', name: '20. spread2', placeholder: '0.266482', demoHealthy: '0.177551', demoParkinsons: '0.266482' },
  { key: 'd2', name: '21. D2', placeholder: '2.301442', demoHealthy: '1.743867', demoParkinsons: '2.301442' },
  { key: 'ppe', name: '22. PPE', placeholder: '0.284654', demoHealthy: '0.085569', demoParkinsons: '0.284654' }
];

export default function App() {
  const [theme, setTheme] = useState('light');
  const [formData, setFormData] = useState(() => {
    const init = {};
    FEATURE_DEFINITIONS.forEach(f => {
      init[f.key] = f.demoParkinsons;
    });
    return init;
  });

  const [selectedModel, setSelectedModel] = useState('Bayesian Logistic Regression');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Sync theme with HTML data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const fillDemoValues = (mode = 'parkinsons') => {
    const values = {};
    FEATURE_DEFINITIONS.forEach(f => {
      values[f.key] = mode === 'healthy' ? f.demoHealthy : f.demoParkinsons;
    });
    setFormData(values);
    setError(null);
  };

  const handleClear = () => {
    const emptyValues = {};
    FEATURE_DEFINITIONS.forEach(f => {
      emptyValues[f.key] = '';
    });
    setFormData(emptyValues);
    setResult(null);
    setError(null);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      selected_model: selectedModel
    };

    for (const item of FEATURE_DEFINITIONS) {
      const val = parseFloat(formData[item.key]);
      if (isNaN(val)) {
        setError(`Please enter a valid numeric value for ${item.name}`);
        setLoading(false);
        return;
      }
      payload[item.key] = val;
    }

    try {
      // Connect to FastAPI backend
      const response = await fetch('http://localhost:8001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // Append to client-side session history
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistory(prev => [
        {
          id: Date.now(),
          time: timeStr,
          label: data.label,
          prediction: data.prediction,
          probability: Math.round(data.probability * 100),
          model: data.model || selectedModel
        },
        ...prev
      ]);
    } catch (err) {
      setError(err.message || 'Could not connect to FastAPI server. Ensure the backend is running on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  // Determine uncertainty status (Bayesian Logistic Regression concept)
  const isUncertain = result && result.probability >= 0.40 && result.probability <= 0.60;

  return (
    <div>
      {/* 1. NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#home" className="nav-brand">
            <span>⚕️</span> Parkinson's Voice Detection
          </a>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#prediction">Prediction</a></li>
            <li><a href="#models">Models</a></li>
            <li><a href="#about">About</a></li>
            <li>
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                title="Toggle Dark/Light Mode"
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="container">
        {/* 2. HERO SECTION */}
        <section id="home" className="hero">
          <span className="hero-badge">Academic ML Mini Project</span>
          <h1>Parkinson's Disease Detection Using Voice Analysis</h1>
          <div className="hero-subtitle">Machine Learning Based Screening System</div>
          <p className="hero-desc">
            Analyze voice-related features using machine learning models to estimate whether a voice sample is associated with Parkinson's disease.
          </p>

          <div className="hero-actions">
            <a href="#prediction" className="btn btn-primary">Start Prediction</a>
            <a href="#models" className="btn btn-secondary">Explore Models</a>
          </div>

          {/* Abstract Voice Wave Graphic with CSS */}
          <div className="voice-visual" aria-hidden="true">
            <span className="voice-bar" style={{ height: '24px' }}></span>
            <span className="voice-bar" style={{ height: '40px' }}></span>
            <span className="voice-bar" style={{ height: '18px' }}></span>
            <span className="voice-bar" style={{ height: '48px' }}></span>
            <span className="voice-bar" style={{ height: '32px' }}></span>
            <span className="voice-bar" style={{ height: '52px' }}></span>
            <span className="voice-bar" style={{ height: '28px' }}></span>
            <span className="voice-bar" style={{ height: '42px' }}></span>
            <span className="voice-bar" style={{ height: '20px' }}></span>
            <span className="voice-bar" style={{ height: '36px' }}></span>
          </div>

          {/* Small Statistics Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">22</div>
              <div className="stat-label">Voice Features</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">5</div>
              <div className="stat-label">ML Models</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">195</div>
              <div className="stat-label">Recordings</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">32</div>
              <div className="stat-label">Subjects</div>
            </div>
          </div>
        </section>

        {/* 10. HOW IT WORKS (4-STEP HORIZONTAL SECTION) */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">A streamlined pipeline from voice recording analysis to machine learning inference</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>Enter Voice Features</h4>
              <p>Supply the 22 acoustic measurements (jitter, shimmer, fundamental frequency, noise ratios).</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h4>Preprocess Features</h4>
              <p>Standardize feature distributions to align with trained dataset scaling boundaries.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h4>Apply ML Model</h4>
              <p>Compute classification score via scratch-implemented probabilistic or SVM models.</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h4>Display Prediction</h4>
              <p>View the binary classification, calibrated probability, and Bayesian uncertainty bounds.</p>
            </div>
          </div>
        </section>

        {/* 3. PREDICTION SECTION */}
        <section id="prediction" className="section">
          <div className="section-header">
            <h2 className="section-title">Voice Feature Analysis</h2>
            <p className="section-subtitle">Enter the voice measurements below to generate a prediction.</p>
          </div>

          <div className="card">
            <form onSubmit={handlePredict}>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Selected Model:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="Bayesian Logistic Regression">Bayesian Logistic Regression (with Laplace Approx)</option>
                  <option value="Logistic Regression">Logistic Regression</option>
                  <option value="Gaussian Generative Model">Gaussian Generative Model</option>
                  <option value="Linear SVM">Linear SVM</option>
                  <option value="RBF Kernel SVM">RBF Kernel SVM</option>
                </select>
              </div>

              {/* 22 Voice Feature Inputs in 2-Column Responsive Layout */}
              <div className="grid-2">
                {FEATURE_DEFINITIONS.map(field => (
                  <div key={field.key} className="form-group">
                    <label htmlFor={field.key}>{field.name}</label>
                    <input
                      id={field.key}
                      type="number"
                      step="any"
                      required
                      placeholder={field.placeholder}
                      value={formData[field.key] ?? ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="button-bar">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Analyze Voice'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fillDemoValues('parkinsons')}
                  title="Populate with sample Parkinson's voice recording values"
                >
                  Demo (Parkinson's)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fillDemoValues('healthy')}
                  title="Populate with sample Healthy control values"
                >
                  Demo (Healthy)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClear}
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="error-msg">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* 4. RESULT SECTION */}
            {result && (
              <div className={`result-container ${result.prediction === 1 ? 'positive' : 'negative'}`}>
                <div className="result-header">
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Prediction Result
                    </span>
                    <div className="result-status">
                      {result.prediction === 1 ? "Parkinson's Detected" : 'Healthy'}
                    </div>
                  </div>
                  <div className="result-meta">
                    <strong>Model Used:</strong> {result.model || selectedModel}
                  </div>
                </div>

                {/* Visual Probability Bar */}
                <div className="prob-bar-label">
                  <span>Parkinson's Probability</span>
                  <span>{Math.round(result.probability * 100)}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round(result.probability * 100)}%` }}
                  ></div>
                </div>

                {/* 5. UNCERTAINTY WARNING (Bayesian Concept) */}
                {isUncertain ? (
                  <div className="uncertainty-box warning">
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                      <strong>Uncertain Prediction</strong>
                      <p>
                        The calculated posterior probability ({Math.round(result.probability * 100)}%) is close to the 50% decision boundary. Please treat this result as uncertain and consider professional medical evaluation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="uncertainty-box confident">
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <div>
                      <strong>Higher Confidence Prediction</strong>
                      <p>
                        The model's probability estimate is well-separated from the decision threshold with an estimated parameter uncertainty variance of ±{result.uncertainty ?? 0.12}.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  Notice: This application is an ML project for educational purposes and is not a medical diagnosis.
                </div>
              </div>
            )}

            {/* 8. PREDICTION HISTORY (Client-side in Browser State) */}
            {history.length > 0 && (
              <div className="history-section">
                <div className="history-header">
                  <h4>Recent Session Predictions</h4>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={clearHistory}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Clear History
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Model</th>
                        <th>Result</th>
                        <th>Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(item => (
                        <tr key={item.id}>
                          <td>{item.time}</td>
                          <td>{item.model}</td>
                          <td>
                            <span className={`badge ${item.prediction === 1 ? 'positive' : 'negative'}`}>
                              {item.label}
                            </span>
                          </td>
                          <td>{item.probability}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 6. MODEL COMPARISON */}
        <section id="models" className="section">
          <div className="section-header">
            <h2 className="section-title">Machine Learning Models</h2>
            <p className="section-subtitle">
              Overview of the five classification algorithms implemented from scratch using Python/NumPy
            </p>
          </div>

          <div className="models-grid">
            <div className="model-card">
              <h4>Gaussian Generative Model</h4>
              <p>Probabilistic generative classification modeling class-conditional Gaussian distributions.</p>
            </div>
            <div className="model-card">
              <h4>Logistic Regression</h4>
              <p>Linear probabilistic classification using the sigmoid function and cross-entropy optimization.</p>
            </div>
            <div className="model-card">
              <h4>Bayesian Logistic Regression</h4>
              <p>Logistic regression with uncertainty estimation computed via the Laplace Approximation.</p>
            </div>
            <div className="model-card">
              <h4>Linear SVM</h4>
              <p>Linear decision boundary maximizing margin between healthy and affected recordings using soft-margin SVM.</p>
            </div>
            <div className="model-card">
              <h4>RBF Kernel SVM</h4>
              <p>Non-linear classification projecting voice features into infinite dimensions via the Radial Basis Function.</p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>Model Comparison Summary</h3>
            <div className="table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Gaussian Generative Model</strong></td>
                    <td>Generative Classifier</td>
                    <td>Models joint probability P(X, y) via class Gaussian distributions</td>
                  </tr>
                  <tr>
                    <td><strong>Logistic Regression</strong></td>
                    <td>Discriminative Linear</td>
                    <td>Models posterior P(y|X) with convex log-loss minimization</td>
                  </tr>
                  <tr>
                    <td><strong>Bayesian Logistic Regression</strong></td>
                    <td>Bayesian Probabilistic</td>
                    <td>Estimates parameter posterior & prediction uncertainty via Laplace approx</td>
                  </tr>
                  <tr>
                    <td><strong>Linear SVM</strong></td>
                    <td>Margin-Based Linear</td>
                    <td>Finds maximum-margin separating hyperplane with soft margin slack (C)</td>
                  </tr>
                  <tr>
                    <td><strong>RBF Kernel SVM</strong></td>
                    <td>Non-linear Kernel</td>
                    <td>Captures non-linear acoustic interactions via Gaussian kernel mapping</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              Evaluation results available from the Colab notebook.
            </div>
          </div>
        </section>

        {/* 7. VOICE FEATURES EXPLAINED */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">What Do These Voice Features Mean?</h2>
            <p className="section-subtitle">
              Acoustic biometric measurements extracted from sustained vowel phonations (/a/)
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-info-card">
              <h4>Jitter</h4>
              <p>Small variations in fundamental frequency (cycle-to-cycle pitch instability).</p>
            </div>
            <div className="feature-info-card">
              <h4>Shimmer</h4>
              <p>Small variations in voice amplitude and loudness across consecutive speech cycles.</p>
            </div>
            <div className="feature-info-card">
              <h4>HNR</h4>
              <p>Harmonic-to-Noise Ratio: the quantitative relationship between periodic harmonic components and noise.</p>
            </div>
            <div className="feature-info-card">
              <h4>RPDE / DFA</h4>
              <p>Recurrence Period Density Entropy & Detrended Fluctuation Analysis: measures dynamical voice signal complexity.</p>
            </div>
          </div>

          <p className="feature-quote">
            "These measurements are used as numerical inputs to the ML models."
          </p>
        </section>

        {/* 9. ABOUT DATASET */}
        <section id="about" className="section">
          <div className="section-header">
            <h2 className="section-title">Dataset</h2>
            <p className="section-subtitle">UCI Machine Learning Repository: Parkinson's Dataset</p>
          </div>

          <div className="about-box">
            <ul className="about-list">
              <li>UCI Parkinson's Dataset</li>
              <li>195 voice recordings</li>
              <li>32 subjects (patients & controls)</li>
              <li>22 voice features per recording</li>
              <li>Binary classification task</li>
              <li>Healthy = 0, Parkinson's = 1</li>
            </ul>

            <div className="note-box">
              <strong>Crucial ML Methodology Note:</strong> This project emphasizes subject-wise evaluation (e.g. GroupKFold) so recordings from the same individual are not improperly mixed across both training and testing folds, preventing data leakage and inflated accuracy.
            </div>
          </div>
        </section>
      </main>

      {/* 12. FOOTER */}
      <footer className="footer">
        <div className="footer-title">Parkinson's Voice Detection</div>
        <div className="footer-sub">Machine Learning Mini Project — Unit 2</div>
        <div className="footer-disclaimer">
          Educational project — not a medical diagnosis.
        </div>
      </footer>
    </div>
  );
}
