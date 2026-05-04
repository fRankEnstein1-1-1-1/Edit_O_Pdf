import { useEffect, useRef, useState } from "react";
import { Canvas, IText, Rect, FabricImage, Path } from "fabric";
import * as pdfjsLib from "pdfjs-dist";
import { addPage, deletePage } from "../api/pdfApi";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export default function PageSidebar({ id, document, currentPage, setCurrentPage, setDocument }) {
  const [thumbnails, setThumbnails] = useState([]);
  const canvasRefs = useRef([]);

  useEffect(() => {
    if (document) renderThumbnails();
  }, [document]);

  const renderThumbnails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/pdf/${id}/file`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const thumbs = [];
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = window.document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL());
      }
      setThumbnails(thumbs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPage = async () => {
    try {
      const res = await addPage(id);
      setDocument((prev) => ({ ...prev, totalPages: res.data.totalPages }));
      setTimeout(() => renderThumbnails(), 500);
    } catch (err) {
      alert("Failed to add page");
    }
  };

  const handleDeletePage = async (e, pageIndex) => {
    e.stopPropagation();
    if (document.totalPages <= 1) return alert("Cannot delete the only page!");
    if (!confirm(`Delete page ${pageIndex + 1}?`)) return;
    try {
      const res = await deletePage(id, pageIndex);
      setDocument((prev) => ({ ...prev, totalPages: res.data.totalPages }));
      if (currentPage >= res.data.totalPages) setCurrentPage(res.data.totalPages - 1);
      setTimeout(() => renderThumbnails(), 500);
    } catch (err) {
      alert("Failed to delete page");
    }
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <span style={styles.headerText}>PAGES</span>
        <button style={styles.addBtn} onClick={handleAddPage}>+ ADD</button>
      </div>

      <div style={styles.list}>
        {thumbnails.map((thumb, i) => (
          <div
            key={i}
            style={{
              ...styles.thumbWrapper,
              ...(currentPage === i ? styles.thumbActive : {}),
            }}
            onClick={() => setCurrentPage(i)}
          >
            <img src={thumb} style={styles.thumb} alt={`Page ${i + 1}`} />
            <div style={styles.pageNum}>
              <span>{i + 1}</span>
              <button
                style={styles.deletePageBtn}
                onClick={(e) => handleDeletePage(e, i)}
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "160px",
    background: "#0f0f0f",
    borderRight: "1px solid #1f1f1f",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem",
    borderBottom: "1px solid #1f1f1f",
  },
  headerText: {
    color: "#444",
    fontSize: "0.65rem",
    letterSpacing: "0.2em",
  },
  addBtn: {
    background: "none",
    border: "1px solid #ff4d00",
    borderRadius: "2px",
    color: "#ff4d00",
    cursor: "pointer",
    fontSize: "0.6rem",
    padding: "0.2rem 0.4rem",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.05em",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  thumbWrapper: {
    border: "1px solid #222",
    borderRadius: "3px",
    cursor: "pointer",
    overflow: "hidden",
    transition: "border-color 0.15s",
  },
  thumbActive: {
    border: "1px solid #ff4d00",
  },
  thumb: {
    width: "100%",
    display: "block",
  },
  pageNum: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.3rem 0.5rem",
    background: "#111",
    color: "#555",
    fontSize: "0.65rem",
  },
  deletePageBtn: {
    background: "none",
    border: "none",
    color: "#333",
    cursor: "pointer",
    fontSize: "0.7rem",
    padding: "0",
  },
};