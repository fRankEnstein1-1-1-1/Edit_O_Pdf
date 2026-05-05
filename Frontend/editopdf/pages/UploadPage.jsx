import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadPdf, getAllPdfs, deletePdf } from "../api/pdfApi";
import "./UploadPage.css";

export default function UploadPage() {
  const [pdfs, setPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => { fetchPdfs(); }, []);

  const fetchPdfs = async () => {
    try {
      const res = await getAllPdfs();
      setPdfs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

 const handleUpload = async (file) => {
    if (!file || file.type !== "application/pdf") return alert("PDF only!");
    const formData = new FormData();
    formData.append("pdf", file);
    setUploading(true);
    try {
      const res = await uploadPdf(formData);
      navigate(`/editor/${res.data.document._id}`);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this PDF?")) return;
    await deletePdf(id);
    fetchPdfs();
  };

 const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
handleUpload(file);
  };
  return (
    <div className="page">
      <div className="container">
        <div className="header">
          <h1 className="title">EDIT<span className="accent">_O_</span>PDF</h1>
          <p className="subtitle">Upload · Edit · Export</p>
        </div>

        <div
          className={`dropzone ${dragOver ? "active" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="drop-icon">⬆</div>
          <p className="drop-text">
            {uploading ? "Uploading..." : "Drop PDF here or click to browse"}
          </p>
          <p className="drop-hint">PDF files only · Max 50MB</p>
        <input
  ref={fileRef}
  type="file"
  accept="application/pdf"
  style={{ display: "none" }}
 onChange={(e) => handleUpload(e.target.files[0])} // Fix: pass the specific file, not the list
/>
        </div>

        {pdfs.length > 0 && (
          <div className="list-section">
            <p className="list-title">RECENT FILES</p>
            <div className="list">
              {pdfs.map((pdf) => (
                <div
                  key={pdf._id}
                  className="list-item"
                  onClick={() => navigate(`/editor/${pdf._id}`)}
                >
                  <div className="pdf-icon">PDF</div>
                  <div className="pdf-info">
                    <p className="pdf-name">{pdf.originalName}</p>
                    <p className="pdf-meta">{pdf.totalPages} pages · {new Date(pdf.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, pdf._id)}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}