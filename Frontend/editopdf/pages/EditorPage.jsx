import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAllPdfs } from "../api/pdfApi";
import TopToolbar from "../components/TopToolbar";
import PageSidebar from "../components/PageSidebar";
import EditorCanvas from "../components/EditorCanvas";

export default function EditorPage() {
  const [activeColor, setActiveColor] = useState("#ff4d00");
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState("select");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllPdfs();
        const found = res.data.find((pdf) => pdf._id === id);
        setDocument(found);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [id]);

  if (!document) return (
    <div style={{ color: "#fff", padding: "2rem", fontFamily: "Courier New" }}>
      Loading...
    </div>
  );

  return (
    <div style={styles.page}>
     <TopToolbar
    activeTool={activeTool}
    setActiveTool={setActiveTool}
    activeColor={activeColor}
    setActiveColor={setActiveColor}
    id={id}
    document={document}
/>
      <div style={styles.body}>
        <PageSidebar
          id={id}
          document={document}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setDocument={setDocument}
        />
       <EditorCanvas
    id={id}
    document={document}
    currentPage={currentPage}
    activeTool={activeTool}
    activeColor={activeColor}  // ← add
/>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0a0a0a",
    fontFamily: "'Courier New', monospace",
    overflow: "hidden",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  colorPicker: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0 1rem",
    borderLeft: "1px solid #1f1f1f",
    borderRight: "1px solid #1f1f1f",
},
colorDot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.15s",
},
colorInput: {
    width: "24px",
    height: "24px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    background: "none",
    padding: 0,
},
};