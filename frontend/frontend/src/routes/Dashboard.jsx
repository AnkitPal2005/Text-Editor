import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [docs, setDocs] = useState([]);
  const [title, setTitle] = useState("");
  const [shareDocId, setShareDocId] = useState(null);
  const [shareRole, setShareRole] = useState("Viewer");
  const [shareLink, setShareLink] = useState("");

  
  const fetchDocs = async () => {
    if (!user) return;
    const res = await fetch(`http://localhost:5000/docs/list/${user.id}`);
    const data = await res.json();
    setDocs(data);
  };

  
  const createDoc = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/docs/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    alert(data.message);
    fetchDocs();
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

  useEffect(() => {
    if (!user) navigate("/login");
    else fetchDocs();
  }, []);

  const closeShareModal = () => {
    setShareDocId(null);
    setShareLink("");
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Manage your documents and start collaborating</p>
        </div>
        <div className="user-profile">
          <div className="profile-avatar">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="create-section">
          <div className="section-title">
            <h2>📝 Create New Document</h2>
            <p>Start a new project or document</p>
          </div>
          <div className="create-form">
            <input
              className="title-input"
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button onClick={createDoc} className="create-btn">
              <span className="btn-icon">+</span>
              Create Document
            </button>
          </div>
        </div>

        <div className="documents-section">
          <div className="section-title">
            <h2>📚 Your Documents</h2>
            <p>{docs?.length || 0} document{docs?.length !== 1 ? 's' : ''} found</p>
          </div>

          {docs && docs.length > 0 ? (
            <div className="documents-grid">
              {docs.map((doc) => (
                <div className="document-card" key={doc._id}>
                  <div className="doc-icon">📄</div>
                  <div className="doc-info">
                    <h3 className="doc-title">{doc.title}</h3>
                    <p className="doc-date">Created recently</p>
                  </div>
                  <div className="doc-actions">
                    <button
                      className="action-btn open-btn"
                      onClick={() => navigate(`/editor/${doc._id}`)}
                    >
                      Open
                    </button>
                    <button
                      className="action-btn share-btn"
                      onClick={() => openShareModal(doc._id)}
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No documents yet</h3>
              <p>Create your first document to get started!</p>
            </div>
          )}
        </div>
      </div>

      {shareDocId && (
        <div className="share-modal">
          <div className="modal-header">
            <h3>🔗 Share Document</h3>
            <button className="close-btn" onClick={closeShareModal}>×</button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>Access Role:</label>
              <select
                className="role-select"
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
              >
                <option value="Viewer">👁️ Viewer (Read only)</option>
                <option value="Editor">✏️ Editor (Can edit)</option>
              </select>
            </div>
            <button onClick={shareDocument} className="generate-btn">
              Generate Share Link
            </button>
            {shareLink && (
              <div className="link-section">
                <p className="link-label">Share this link:</p>
                <div className="link-display">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="link-input"
                  />
                  <button onClick={copyLink} className="copy-btn">
                    📋 Copy
                  </button>
                </div>
                <button className="close-modal-btn" onClick={closeShareModal}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
