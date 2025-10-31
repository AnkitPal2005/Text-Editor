import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import ThemeToggle from "../component/ThemeToggle";

function Dashboard() {
  const navigate = useNavigate();
  
  // Safe user parsing
  let user = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "null") {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
  }
  
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [shareDocId, setShareDocId] = useState(null);
  const [shareRole, setShareRole] = useState("Viewer");
  const [shareLink, setShareLink] = useState("");
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [viewMode, setViewMode] = useState("grid");

  const fetchDocs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/docs/list/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const createDoc = async () => {
    if (!title.trim()) return;
    
    try {
      setCreating(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const res = await fetch("http://localhost:5000/docs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create document');
      }
      
      const data = await res.json();
      setTitle("");
      
      if (data.doc && data.doc._id) {
        navigate(`/editor/${data.doc._id}`);
      } else {
        await fetchDocs();
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert(error.message || 'An error occurred while creating the document');
    } finally {
      setCreating(false);
    }
  };

  const openShareModal = (docId) => {
    setShareDocId(docId);
    setShareLink("");
  };

  const shareDocument = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/docs/share/${shareDocId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: shareRole }),
    });
    const data = await res.json();
    if (data.link) {
      setShareLink(data.link);
    } else {
      alert(data.message);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copied to clipboard!");
  };

  const deleteDocument = async (docId) => {
    setDeletingDocId(docId);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`http://localhost:5000/docs/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document');
      }
      
      setDocs(prevDocs => prevDocs.filter(doc => doc._id !== docId));
      setShowDeleteConfirm(null);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.message || 'Failed to delete document. Please try again.');
    } finally {
      setDeletingDocId(null);
    }
  };

  const confirmDelete = (docId, e) => {
    e.stopPropagation();
    setShowDeleteConfirm(docId);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(null);
  };

  // Filter and sort documents
  const filteredAndSortedDocs = useMemo(() => {
    let filtered = docs.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'updatedAt':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });
    
    return filtered;
  }, [docs, searchTerm, sortBy]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      fetchDocs();
    }
  }, []);

  const closeShareModal = () => {
    setShareDocId(null);
    setShareLink("");
  };

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Modern Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <div className="welcome-text">
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{user?.name}</span>! 
                <span className="wave-emoji">👋</span>
              </h1>
              <p className="welcome-subtitle">Ready to create something amazing today?</p>
            </div>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-info">
                  <span className="stat-number">{docs.length}</span>
                  <span className="stat-label">Documents</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <span className="stat-number">Live</span>
                  <span className="stat-label">Collaboration</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <ThemeToggle className="theme-toggle-header" />
            <div className="user-profile">
              <div className="profile-avatar">
                <span className="avatar-text">{user?.name?.[0]?.toUpperCase() || "U"}</span>
                <div className="avatar-status"></div>
              </div>
              <div className="profile-info">
                <span className="profile-name">{user?.name}</span>
                <span className="profile-email">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          
          {/* Quick Create Section */}
          <section className="create-section">
            <div className="section-header">
              <div className="section-icon">✨</div>
              <div className="section-title">
                <h2>Create New Document</h2>
                <p>Start your next masterpiece</p>
              </div>
            </div>
            
            <div className="create-form">
              <div className="input-wrapper">
                <input
                  className="title-input"
                  placeholder="What would you like to create today?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createDoc()}
                  disabled={creating}
                />
                <div className="input-decoration"></div>
              </div>
              
              <button 
                onClick={createDoc} 
                className={`create-btn ${creating ? 'loading' : ''} ${!title.trim() ? 'disabled' : ''}`}
                disabled={creating || !title.trim()}
              >
                {creating ? (
                  <>
                    <div className="btn-spinner"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span>Create Document</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Documents Section */}
          <section className="documents-section">
            <div className="section-header">
              <div className="section-title">
                <div className="title-with-icon">
                  <div className="section-icon">📚</div>
                  <div>
                    <h2>Your Documents</h2>
                    <p>{filteredAndSortedDocs?.length || 0} document{filteredAndSortedDocs?.length !== 1 ? 's' : ''} ready to edit</p>
                  </div>
                </div>
              </div>
              
              <div className="section-controls">
                <div className="search-container">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="filter-container">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                  >
                    <option value="updatedAt">Recently Updated</option>
                    <option value="createdAt">Recently Created</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
                
                <div className="view-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"/>
                      <line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/>
                      <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Documents Content */}
            <div className="documents-content">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-animation">
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                  <p>Loading your documents...</p>
                </div>
              ) : filteredAndSortedDocs && filteredAndSortedDocs.length > 0 ? (
                <div className={`documents-grid ${viewMode}`}>
                  {filteredAndSortedDocs.map((doc) => (
                    <div className="document-card" key={doc._id}>
                      <div className="card-header">
                        <div className="doc-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                          </svg>
                        </div>
                        <div className="card-menu">
                          <button className="menu-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"/>
                              <circle cx="12" cy="5" r="1"/>
                              <circle cx="12" cy="19" r="1"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="card-content">
                        <h3 className="doc-title">{doc.title}</h3>
                        <div className="doc-meta">
                          <div className="meta-item">
                            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6M12 17v6M5.64 7.05l4.95 4.95M13.41 13.59l4.95 4.95M7.05 18.36l4.95-4.95M13.59 10.41l4.95-4.95"/>
                            </svg>
                            <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="meta-item">
                            <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>Created {new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="card-actions">
                        <button
                          className="action-btn primary"
                          onClick={() => navigate(`/editor/${doc._id}`)}
                          title="Open document"
                        >
                          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                          </svg>
                          <span>Open</span>
                        </button>
                        
                        <button
                          className="action-btn secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareModal(doc._id);
                          }}
                          title="Share document"
                        >
                          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16,6 12,2 8,6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                          </svg>
                          <span>Share</span>
                        </button>
                        
                        {showDeleteConfirm === doc._id ? (
                          <div className="delete-confirm">
                            <span className="confirm-text">Delete?</span>
                            <button
                              className="confirm-btn yes"
                              onClick={() => deleteDocument(doc._id)}
                              disabled={deletingDocId === doc._id}
                            >
                              {deletingDocId === doc._id ? '...' : '✓'}
                            </button>
                            <button
                              className="confirm-btn no"
                              onClick={cancelDelete}
                              disabled={deletingDocId === doc._id}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="action-btn danger"
                            onClick={(e) => confirmDelete(doc._id, e)}
                            title="Delete document"
                            disabled={deletingDocId === doc._id}
                          >
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <h3>No documents found</h3>
                  <p>We couldn't find any documents matching "{searchTerm}"</p>
                  <button 
                    className="empty-action-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-illustration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <h3>Ready to create your first document?</h3>
                  <p>Start collaborating and bring your ideas to life</p>
                  <button 
                    className="empty-action-btn"
                    onClick={() => document.querySelector('.title-input')?.focus()}
                  >
                    Create Your First Document
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Share Modal */}
      {shareDocId && (
        <div className="modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <svg className="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16,6 12,2 8,6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <h3>Share Document</h3>
              </div>
              <button className="close-btn" onClick={closeShareModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Access Level</label>
                <select
                  className="role-select"
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                >
                  <option value="Viewer">👁️ Viewer - Can only read</option>
                  <option value="Editor">✏️ Editor - Can read and edit</option>
                </select>
              </div>
              
              <button onClick={shareDocument} className="generate-btn">
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Generate Share Link
              </button>
              
              {shareLink && (
                <div className="link-section">
                  <label>Share this link</label>
                  <div className="link-container">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="link-input"
                    />
                    <button onClick={copyLink} className="copy-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;