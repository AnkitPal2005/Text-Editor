import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "../styles/Editor.css";
import socket from "./socket";
function Editor() {
  const { id } = useParams();
  const [content, setContent] = useState("");
  const quillRef = useRef(null);
  const [role, setRole] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const[versions,setVersions]=useState([]);
  const [openversions,setOpenversions]=useState(false);
  const modules = {
    toolbar: [
      [{ font: [] }, { size: [] }],
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
    "font",
    "size",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "blockquote",
    "code-block",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
  ];

  useEffect(() => {
    const fetchDocByLink = async () => {
      const res = await fetch(`http://localhost:5000/docs/share-link/${id}`);
      const data = await res.json();
      setContent(data.content);
      setRole(data.role);
      setReadOnly(data.role === "Viewer");
    };

    if (id) fetchDocByLink();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    socket.emit("join-doc", id);
  }, [id]);

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
    const hgetdata = async () => {
      const res = await fetch(`http://localhost:5000/docs/getdata/${id}`);
      const data = await res.json();
      console.log(data)
      setContent(data.content);
    };
    hgetdata();
  }, [id]);
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", { delta, id });
    };

    editor.on("text-change", handler);
    return () => editor.off("text-change", handler);
  }, [id]);

  const fetchVersions=async()=>{
    try{
      setOpenversions(pre=>!pre);
      const res = await fetch(`http://localhost:5000/docs/${id}/versions`, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      const data=await res.json();
      setVersions(data);
    }
    catch(err){
      console.error("Error Fetching Versions",err);
    }
  }

  const handleSave = async () => {
    const plainText = content.replace(/<[^>]+>/g, "").trim();

    if (!plainText) {
      alert("Document is empty. Please add some content before saving.");  
      return;
    }
    console.log(content, content.trim(), "ololol");
    try {
      await fetch(`http://localhost:5000/docs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({ content }),
      });
        await fetch(`http://localhost:5000/docs/${id}/saveVersion`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token"),
          },
          body: JSON.stringify({ content }),
        });
    alert("Document Save Successfully");

      fetchVersions();
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleChange = (content) => {
    setContent(content);
  };

const handleRestore=async(versionId)=>{
  try{
    console.log(versionId)
    await fetch(`http://localhost:5000/docs/${id}/restore/${versionId}`,{
      method:"POST",
      headers:{Authorization:localStorage.getItem("token")},
    });
    const res=await fetch(`http://localhost:5000/docs/getdata/${id}`);
    const data=await res.json();
    setContent(data.content);
    fetchVersions();
  }
  catch(err){
    console.error("Error restoring version: ",err);
  }
};  

  return (
    <div className="editor-page">
      <div className="editor-header">
        <h2>Document Editor</h2>
        <button className="save-btn" onClick={handleSave}>
          Save Changes
        </button>
        <button className="version-btn" onClick={fetchVersions}>Show Versions</button>
      </div>
      <div className="editor-container">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          readOnly={readOnly}
          placeholder="Start writing here..."
        />
      </div>
      {versions.length>0&&openversions&&(
        <div className="versions-container">
          <h3>Version History</h3>
          <ul>
            {versions.map((v)=>(
              <li key={v._id}>
                {new Date(v.createdAt).toLocaleString()}{" "}
                <button onClick={()=>handleRestore(v._id)}>Restore</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Editor;




