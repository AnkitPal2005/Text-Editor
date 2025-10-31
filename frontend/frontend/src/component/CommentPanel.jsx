import React, { useEffect, useState } from "react";
import "../styles/CommentPanel.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CommentPanel = ({ documentId, sectionId, userId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all comments for a section
  useEffect(() => {
    if (!(documentId && sectionId)) return;
    
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API}/api/comments/${documentId}/${sectionId}`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch comments: ${res.status}`);
        }
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching comments:", err.message);
        setError("Failed to load comments");
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [documentId, sectionId]);

  // Add a new comment
  const handleComment = async () => {
    if (!newComment.trim() || !userId) return;
    
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          sectionId,
          author: userId,
          text: newComment.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to post comment: ${res.status}`);
      }

      const data = await res.json();
      setComments((prev) => [data, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err.message);
      alert("Failed to post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  // Resolve comment (delete)
  const handleResolve = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`${API}/api/comments/resolve/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Failed to resolve comment: ${res.status}`);
      }
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== id));
    } catch (err) {
      console.error("Error resolving comment:", err.message);
      alert("Failed to resolve comment. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="comment-panel">
      <div className="comment-header">
        <h3>💬 Comments</h3>
        <span className="comment-count">{comments.length}</span>
      </div>

      <div className="comment-list">
        {loading ? (
          <div className="comment-loading">
            <div className="loading-spinner"></div>
            <p>Loading comments...</p>
          </div>
        ) : error ? (
          <div className="comment-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No comments yet</p>
            <span>Start the conversation!</span>
          </div>
        ) : (
          comments.map((c) => {
            const cid = c._id || c.id;
            return (
              <div key={cid} className="comment">
                <div className="comment-header-info">
                  <div className="comment-author">
                    <div className="author-avatar">
                      {(c.author?.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="author-info">
                      <span className="author-name">{c.author?.name || "Anonymous"}</span>
                      <span className="comment-time">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                  <button 
                    className="resolve-btn"
                    onClick={() => handleResolve(cid)}
                    title="Resolve comment"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  </button>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="comment-input-section">
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={posting}
          rows="3"
        />
        <button 
          onClick={handleComment} 
          disabled={posting || !newComment.trim() || !userId} 
          className="comment-submit-btn"
        >
          {posting ? (
            <>
              <div className="loading-spinner small"></div>
              Posting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
              Post Comment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommentPanel;
