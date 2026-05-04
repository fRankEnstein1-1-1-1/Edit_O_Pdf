import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadPdf, getAllPdfs, deletePdf } from "../api/pdfApi";

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
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>EDIT<span style={styles.accent}>_O_</span>PDF</h1>
          <p style={styles.subtitle}>Upload · Edit · Export</p>
        </div>

        {/* Drop Zone */}
        <div
          style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div style={styles.dropIcon}>⬆</div>
          <p style={styles.dropText}>
            {uploading ? "Uploading..." : "Drop PDF here or click to browse"}
          </p>
          <p style={styles.dropHint}>PDF files only · Max 50MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </div>

        {/* PDF List */}
        {pdfs.length > 0 && (
          <div style={styles.listSection}>
            <p style={styles.listTitle}>RECENT FILES</p>
            <div style={styles.list}>
              {pdfs.map((pdf) => (
                <div
                  key={pdf._id}
                  style={styles.listItem}
                  onClick={() => navigate(`/editor/${pdf._id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
                  onMouseLeave={e => e.currentTarget.style.background = "#111"}
                >
                  <div style={styles.pdfIcon}>PDF</div>
                  <div style={styles.pdfInfo}>
                    <p style={styles.pdfName}>{pdf.originalName}</p>
                    <p style={styles.pdfMeta}>{pdf.totalPages} pages · {new Date(pdf.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    style={styles.deleteBtn}
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Courier New', monospace",
    padding: "2rem",
  },
  container: {
    width: "100%",
    maxWidth: "600px",
  },
  header: {
    marginBottom: "2.5rem",
    textAlign: "center",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "900",
    color: "#fff",
    letterSpacing: "0.1em",
    margin: 0,
  },
  accent: {
    color: "#ff4d00",
  },
  subtitle: {
    color: "#555",
    fontSize: "0.8rem",
    letterSpacing: "0.3em",
    marginTop: "0.5rem",
  },
  dropzone: {
    border: "2px dashed #333",
    borderRadius: "4px",
    padding: "3rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#0f0f0f",
  },
  dropzoneActive: {
    border: "2px dashed #ff4d00",
    background: "#150a00",
  },
  dropIcon: {
    fontSize: "2rem",
    marginBottom: "1rem",
    color: "#ff4d00",
  },
  dropText: {
    color: "#ccc",
    fontSize: "1rem",
    margin: "0 0 0.5rem",
  },
  dropHint: {
    color: "#444",
    fontSize: "0.75rem",
    margin: 0,
  },
  listSection: {
    marginTop: "2.5rem",
  },
  listTitle: {
    color: "#444",
    fontSize: "0.7rem",
    letterSpacing: "0.3em",
    marginBottom: "0.75rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    background: "#111",
    border: "1px solid #1f1f1f",
    borderRadius: "4px",
    padding: "0.75rem 1rem",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  pdfIcon: {
    background: "#ff4d00",
    color: "#fff",
    fontSize: "0.6rem",
    fontWeight: "900",
    padding: "0.3rem 0.4rem",
    borderRadius: "2px",
    letterSpacing: "0.05em",
  },
  pdfInfo: {
    flex: 1,
    overflow: "hidden",
  },
  pdfName: {
    color: "#ddd",
    fontSize: "0.85rem",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pdfMeta: {
    color: "#555",
    fontSize: "0.7rem",
    margin: "0.2rem 0 0",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "0.2rem 0.4rem",
    borderRadius: "2px",
    transition: "color 0.15s",
  },
};