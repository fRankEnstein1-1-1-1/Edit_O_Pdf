import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAllPdfs } from "../api/pdfApi";
import TopToolbar from "../components/TopToolbar";
import PageSidebar from "../components/PageSidebar";
import EditorCanvas from "../components/EditorCanvas";

export default function EditorPage() {
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
};