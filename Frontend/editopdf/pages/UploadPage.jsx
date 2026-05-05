import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadPdf, getAllPdfs, deletePdf } from "../api/pdfApi";
import "./UploadPage.css";

export default function UploadPage() {
  const [pdfs, setPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const res = await getAllPdfs();
      setPdfs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // New function: Triggered when user selects/drops a file
  const handleFileSelect = (file) => {
    if (!file || file.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      return;
    }

    setPendingFile(file);
    setShowTutorialModal(true);     // Show tutorial dialog
  };

  // User clicks "Yes, show me tutorial"
 const handleStartTutorial = async () => {
  setShowTutorialModal(false);

  if (!pendingFile) return;

  const formData = new FormData();
  formData.append("pdf", pendingFile);

  try {
    const res = await uploadPdf(formData);

    navigate("/tutorial", {
      state: { documentId: res.data.document._id }
    });
  } catch (err) {
    alert("Upload failed");
  }
};

  // User clicks "No, skip tutorial"
  const handleSkipTutorial = async () => {
    setShowTutorialModal(false);
    if (pendingFile) {
      await uploadAndNavigate(pendingFile);
    }
  };

  // Actual upload function
  const uploadAndNavigate = async (file) => {
    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    try {
      const res = await uploadPdf(formData);
      navigate(`/editor/${res.data.document._id}`);
    } catch (err) {
      alert("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      setPendingFile(null);
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
    handleFileSelect(file);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="header">
         <h1 className="title">EDIT_<span className="accent">Ω</span>_PDF</h1>
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
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
        </div>

        {/* Recent Files Section */}
  

        {/* 🔥 NEW ANIMATED FOOTER - Add this here */}
  {/* 🔥 BOTTOM-RIGHT CORNER FOOTER - Fixed position */}
<footer className="footer-corner">
  <div className="footer-corner-content">
    <div className="footer-corner-flame"></div>
    <p className="footer-corner-text">
      Made for <span className="footer-corner-heart">YOU</span> by <strong className="footer-corner-name">fRankEnstein</strong>
    </p>
    <p className="footer-corner-tagline">Chekout my github profile for more</p>
    <div className="footer-corner-sparks">
      <span className="corner-spark">✦</span>
      <span className="corner-spark">✧</span>
      <span className="corner-spark">✦</span>
    </div>
  </div>
</footer>
      </div>

   {/* Burning God of War Modal */}
{showTutorialModal && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <span className="icon">⚡</span>
        <h2>Welcome to Edit_O_PDF</h2>
      </div>
     
      <div className="modal-body">
        <p>Before you begin, would you like a quick tutorial on how to use <strong>Edit_O_PDF</strong>?</p>
        <p className="modal-subtext">Get started quickly with our guided tour...</p>
      </div>
      <div className="modal-buttons">
        <button className="btn-tutorial" onClick={handleStartTutorial}>
          Yes, show me how
        </button>
        <button className="btn-skip" onClick={handleSkipTutorial}>
          No, I'll figure it out
        </button>
      </div>
      <div className="modal-footer">
        First time using Edit_O_PDF
      </div>
    </div>
  </div>
)}
    </div>
  );
}