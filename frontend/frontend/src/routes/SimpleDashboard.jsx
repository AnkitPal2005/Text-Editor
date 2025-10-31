import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../component/ThemeToggle";

function SimpleDashboard() {
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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDocs = async () => {
    if (!user) {
      console.log("No user in fetchDocs");
      return;
    }
    
    try {
      console.log("Fetching docs for user:", user.id);
      setLoading(true);
      const res = await fetch(`http://localhost:5000/docs/list/${user.id}`);
      console.log("Fetch response status:", res.status);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      console.log("Fetched docs data:", data);
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const createDoc = async () => {
    if (!title.trim()) {
      return;
    }
    
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
      
      // Navigate to the newly created document
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

  // Filter documents
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [docs, searchTerm]);

  useEffect(() => {
    console.log("Dashboard useEffect - user:", user);
    if (!user) {
      console.log("No user found, redirecting to login");
      navigate("/login");
    } else {
      console.log("User found, fetching docs");
      fetchDocs();
    }
  }, []);

  console.log("Dashboard render - user:", user, "loading:", loading, "docs:", docs);

  if (!user) {
    return <div style={{padding: '20px', color: 'red'}}>No user found, redirecting to login...</div>;
  }

  return (
    <div style={{minHeight: '100vh', background: '#f0f0f0', padding: '20px'}}>
      {/* Header */}
      <div style={{background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{margin: 0, marginBottom: '5px'}}>Welcome back, {user?.name}! 👋</h1>
          <p style={{margin: 0, color: '#666'}}>Manage your documents and start collaborating</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Debug Info */}
      <div style={{padding: '15px', background: 'yellow', margin: '10px 0', borderRadius: '4px'}}>
        DEBUG: Dashboard is rendering! User: {user?.name}, Loading: {loading.toString()}, Docs count: {docs.length}
      </div>

      {/* Create Document Section */}
      <div style={{background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px'}}>
        <h2 style={{margin: '0 0 10px 0'}}>📝 Create New Document</h2>
        <p style={{margin: '0 0 15px 0', color: '#666'}}>Start a new project or document</p>
        <div style={{display: 'flex', gap: '10px'}}>
          <input
            style={{flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px'}}
            placeholder="Enter document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createDoc()}
            disabled={creating}
          />
          <button 
            onClick={createDoc} 
            style={{
              padding: '10px 20px', 
              background: creating || !title.trim() ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: creating || !title.trim() ? 'not-allowed' : 'pointer'
            }}
            disabled={creating || !title.trim()}
          >
            {creating ? "Creating..." : "Create Document"}
          </button>
        </div>
      </div>

      {/* Documents Section */}
      <div style={{background: 'white', padding: '20px', borderRadius: '8px'}}>
        <h2 style={{margin: '0 0 10px 0'}}>📚 Your Documents</h2>
        <p style={{margin: '0 0 20px 0', color: '#666'}}>{filteredDocs?.length || 0} document{filteredDocs?.length !== 1 ? 's' : ''} found</p>
        
        {/* Search */}
        <div style={{marginBottom: '20px'}}>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '300px'}}
          />
        </div>

        {/* Documents List */}
        {loading ? (
          <div style={{textAlign: 'center', padding: '40px'}}>
            <p>Loading your documents...</p>
          </div>
        ) : filteredDocs && filteredDocs.length > 0 ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
            {filteredDocs.map((doc) => (
              <div key={doc._id} style={{border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: '#f9f9f9'}}>
                <h3 style={{margin: '0 0 10px 0'}}>{doc.title}</h3>
                <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#666'}}>
                  Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
                <p style={{margin: '0 0 15px 0', fontSize: '14px', color: '#666'}}>
                  Created: {new Date(doc.createdAt).toLocaleDateString()}
                </p>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={() => navigate(`/editor/${doc._id}`)}
                    style={{padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    📄 Open
                  </button>
                  <button
                    onClick={() => alert('Share functionality coming soon!')}
                    style={{padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    🔗 Share
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this document?')) {
                        // Delete functionality would go here
                        alert('Delete functionality coming soon!');
                      }
                    }}
                    style={{padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div style={{textAlign: 'center', padding: '40px'}}>
            <h3>No documents found</h3>
            <p>Try adjusting your search terms or create a new document.</p>
            <button 
              onClick={() => setSearchTerm('')}
              style={{padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '40px'}}>
            <h3>No documents yet</h3>
            <p>Create your first document to get started!</p>
            <button 
              onClick={() => document.querySelector('input[placeholder="Enter document title..."]')?.focus()}
              style={{padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
            >
              Create Your First Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleDashboard;