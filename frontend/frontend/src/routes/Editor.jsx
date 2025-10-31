import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../styles/Editor.css";
import socket from "./socket";
import ThemeToggle from "../component/ThemeToggle";
import CommentPanel from "../component/CommentPanel";

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const quillRef = useRef(null);
  const [role, setRole] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [openversions, setOpenversions] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.id || null;
    } catch (_) {
      return null;
    }
  })();

  const modules = {
    toolbar: [
      [{ font: [] }, { size: ["small", false, "large", "huge"] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  const formats = [
    "font", "size", "header", "bold", "italic", "underline", "strike",
    "color", "background", "script", "blockquote", "code-block",
    "list", "bullet", "indent", "align", "link", "image", "video",
  ];

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      try {
        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const url = isObjectId
          ? `http://localhost:5000/docs/getdata/${id}`
          : `http://localhost:5000/docs/share-link/${id}`;
        
        console.log("Fetching document from:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load doc (${res.status})`);
        const data = await res.json();
        
        console.log("Document data received:", data);
        
        setContent(data.content || "");
        setDocumentTitle(data.title || "Untitled Document");
        setRoomId(isObjectId ? id : (data.docId || id));
        
        if (data.role) {
          setRole(data.role);
          setReadOnly(data.role === "Viewer");
        }
      } catch (e) {
        console.error("Load doc error", e);
        setDocumentTitle("Untitled Document");
      }
    };

    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (!roomId) return;
    socket.emit("join-doc", roomId);
    
    const handleConnect = () => {
      const queued = JSON.parse(localStorage.getItem(`edit-queue:${roomId}`) || "[]");
      if (queued.length > 0) {
        queued.forEach((delta) => socket.emit("send-changes", { delta, docId: roomId }));
        localStorage.removeItem(`edit-queue:${roomId}`);
      }
    };
    
    socket.on("connect", handleConnect);
    socket.on("disconnect", () => {});
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect");
    };
  }, [roomId]);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    const handleReceive = (delta) => {
      editor.updateContents(delta);
    };

    socket.on("receive-changes", handleReceive);
    return () => socket.off("receive-changes", handleReceive);
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;

      const editor = quillRef.current?.getEditor();
      if (editor) {
        const currentContent = editor.root.innerHTML;
        if (currentContent !== content) {
          debouncedSave(currentContent);
          setContent(currentContent);
        }
      }

      if (socket.connected) {
        socket.emit("send-changes", { delta, docId: roomId || id });
      } else {
        const key = `edit-queue:${roomId || id}`;
        const queued = JSON.parse(localStorage.getItem(key) || "[]");
        queued.push(delta);
        localStorage.setItem(key, JSON.stringify(queued));
      }
    };

    editor.on("text-change", handler);
    return () => editor.off("text-change", handler);
  }, [id, roomId, content]);

  const fetchVersions = async () => {
    try {
      setShowVersions(!showVersions);
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      const url = isObjectId
        ? `http://localhost:5000/docs/${id}/versions`
        : `http://localhost:5000/docs/share-link/${id}/versions`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setVersions(data);
    } catch (err) {
      console.error("Error Fetching Versions", err);
    }
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const saveDocument = async (contentToSave) => {
    if (!contentToSave && contentToSave !== '') return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('No authentication token found');
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`http://localhost:5000/docs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: contentToSave }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save document');
      }

      setLastSaved(new Date());
      return { success: true };
    } catch (error) {
      console.error('Error saving document:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = useRef(debounce(saveDocument, 2000)).current;

  const handleSave = async () => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const currentContent = editor.root.innerHTML;
    const { success, error } = await saveDocument(currentContent);

    if (!success) {
      alert(`Error saving document: ${error || 'Unknown error'}`);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await fetch(`http://localhost:5000/docs/${id}/restore/${versionId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const res = await fetch(`http://localhost:5000/docs/getdata/${id}`);
      const data = await res.json();
      setContent(data.content);
      fetchVersions();
    } catch (err) {
      console.error("Error restoring version: ", err);
    }
  };

  const handleChange = (content) => {
    setContent(content);
  };

  const formatLastSaved = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="editor-page">
      {/* Modern Header */}
      <header className="editor-header">
        <div className="header-left">
          <button 
            className="back-btn"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <div className="document-info">
            <h1 className="document-title">{documentTitle}</h1>
            <div className="document-meta">
              <div className="save-status">
                {saving ? (
                  <div className="saving-indicator">
                    <div className="saving-spinner"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="saved-indicator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    <span>Saved {formatLastSaved(lastSaved)}</span>
                  </div>
                )}
              </div>
              {role && (
                <div className="role-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {role === "Editor" ? (
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    ) : (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    )}
                  </svg>
                  <span>{role}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="collaborators">
            {collaborators.slice(0, 3).map((collaborator, index) => (
              <div key={index} className="collaborator-avatar" title={collaborator.name}>
                {collaborator.name[0].toUpperCase()}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div className="collaborator-count">+{collaborators.length - 3}</div>
            )}
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-btn secondary"
              onClick={fetchVersions}
              title="Version History"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M5.64 7.05l4.95 4.95M13.41 13.59l4.95 4.95M7.05 18.36l4.95-4.95M13.59 10.41l4.95-4.95"/>
              </svg>
              <span>History</span>
            </button>
            
            <a
              className="action-btn secondary"
              href={/^[a-f\d]{24}$/i.test(id)
                ? `http://localhost:5000/docs/${id}/export/pdf`
                : `http://localhost:5000/docs/share-link/${id}/export/pdf`}
              target="_blank"
              rel="noreferrer"
              title="Export as PDF"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Export</span>
            </a>
            
            <button 
              className="action-btn primary"
              onClick={handleSave}
              disabled={saving}
              title="Save Document"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              <span>Save</span>
            </button>
            
            <ThemeToggle className="theme-toggle-editor" />
          </div>
        </div>
      </header>

      {/* Editor Container */}
      <div className="editor-container">
        <div className="editor-main">
          <div className="quill-wrapper">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              readOnly={readOnly}
              placeholder="Start writing your masterpiece..."
              className="modern-quill"
            />
          </div>
        </div>
        
        <CommentPanel
          documentId={id}
          sectionId={"main-section"}
          userId={currentUserId}
        />
      </div>

      {/* Version History Panel */}
      {showVersions && versions.length > 0 && (
        <div className="versions-panel">
          <div className="versions-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6M12 17v6M5.64 7.05l4.95 4.95M13.41 13.59l4.95 4.95M7.05 18.36l4.95-4.95M13.59 10.41l4.95-4.95"/>
              </svg>
              Version History
            </h3>
            <button 
              className="close-versions"
              onClick={() => setShowVersions(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          <div className="versions-list">
            {versions.map((version) => (
              <div key={version._id} className="version-item">
                <div className="version-info">
                  <div className="version-date">
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                  <div className="version-meta">
                    Auto-saved version
                  </div>
                </div>
                <button 
                  className="restore-btn"
                  onClick={() => handleRestore(version._id)}
                  title="Restore this version"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1,4 1,10 7,10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Editor;