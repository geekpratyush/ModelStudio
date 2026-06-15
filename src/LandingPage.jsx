import { Box, Workflow, Database, ArrowRight, Zap, Shield, Layout, Layers, GitBranch } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onLaunch }) => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <Box size={24} color="#3b82f6" />
          <span>Modeler Studio</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="https://github.com/geekpratyush/DDDModelStudio" target="_blank" rel="noopener noreferrer" className="github-link">
            <GitBranch size={20} />
          </a>
          <button className="btn btn-primary nav-cta" onClick={onLaunch}>
            Launch Studio
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen Modeling</div>
          <h1>Design Complex Systems <span className="text-gradient">With Precision</span></h1>
          <p>
            The ultimate visual workspace for Domain-Driven Design, Enterprise Integration Patterns, 
            and System Architecture. Turn ideas into structured blueprints in seconds.
          </p>
          <div className="hero-actions">
            <button className="btn btn-lg btn-primary" onClick={onLaunch}>
              Start Modeling Free <ArrowRight size={20} />
            </button>
            <div className="hero-stats">
              <span>Used by 500+ Architects</span>
              <div className="divider"></div>
              <span>Open Source</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card ddd-card">
            <Layers size={32} color="#8b5cf6" />
            <span>DDD Bounded Contexts</span>
          </div>
          <div className="visual-card eip-card">
            <Workflow size={32} color="#f59e0b" />
            <span>EIP Integration Routes</span>
          </div>
          <div className="visual-card arch-card">
            <Layout size={32} color="#0ea5e9" />
            <span>System Architecture</span>
          </div>
          <div className="visual-glow"></div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Everything You Need to <span className="text-gradient">Architect Success</span></h2>
          <p>A comprehensive toolset for modern software engineering workflows.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon ddd">
              <Box size={24} />
            </div>
            <h3>Strategic DDD</h3>
            <p>Map bounded contexts, subdomains, and context maps to align technical architecture with business goals.</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon eip">
              <Workflow size={24} />
            </div>
            <h3>EIP Engine</h3>
            <p>Design Apache Camel routes visually with support for routers, filters, and complex transformations.</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon arch">
              <Database size={24} />
            </div>
            <h3>UML & Database</h3>
            <p>Create clean class diagrams, ER diagrams, and system architecture layouts with ease.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon fast">
              <Zap size={24} />
            </div>
            <h3>Live Code Generation</h3>
            <p>Export your diagrams directly to Camel YAML or JSON blueprints instantly.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon secure">
              <Shield size={24} />
            </div>
            <h3>Local-First</h3>
            <p>Your data stays in your browser. Auto-save ensures you never lose progress, even without a server.</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon custom">
              <Layout size={24} />
            </div>
            <h3>Infinite Canvas</h3>
            <p>A high-performance interactive canvas that scales to the most complex system diagrams.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-box">
          <h2 className="text-gradient-animated">Ready to Build Better Systems?</h2>
          <p>Join architects and developers building the future of system design.</p>
          <button className="btn btn-lg btn-light" onClick={onLaunch}>
            Launch Studio Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="nav-logo">
            <Box size={20} color="#3b82f6" />
            <span>Modeler Studio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="https://github.com/geekpratyush/DDDModelStudio" target="_blank" rel="noopener noreferrer" className="github-link" style={{ color: 'var(--text-secondary)' }}>
              <GitBranch size={20} />
            </a>
            <p>&copy; 2026 DDDModelStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
