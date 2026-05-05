import { exportPdf } from "../api/pdfApi";

const tools = [
  { id: "select", label: "SELECT", icon: "↖" },
  { id: "text", label: "TEXT", icon: "T" },
  { id: "whitebox", label: "ERASER", icon: "▭" },
  { id: "draw", label: "DRAW", icon: "✏" },
  { id: "image", label: "IMAGE", icon: "⊞" },
   { id: "delete", label: "DELETE", icon: "✕" },
];

export default function TopToolbar({ activeTool, setActiveTool, activeColor, setActiveColor, id, document }) {
const colors = ["#000000", "#ff4d00", "#ff0000", "#0000ff", "#008000", "#ffffff", "#ffff00", "#ff69b4"];
  const handleExport = async () => {
    try {
      const res = await exportPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", `edited-${document.originalName}`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Export failed");
    }
  };

  return (
    <div style={styles.toolbar}>
        {/* Left — filename */}
        <div style={styles.filename}>
            <span style={styles.accent}>▶</span> {document.originalName}
        </div>

        {/* Center — tools + color picker */}
        <div style={styles.centerGroup}>
            <div style={styles.tools}>
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        style={{
                            ...styles.toolBtn,
                            ...(activeTool === tool.id ? styles.toolBtnActive : {}),
                        }}
                        onClick={() => setActiveTool(tool.id)}
                    >
                        <span style={styles.toolIcon}>{tool.icon}</span>
                        <span style={styles.toolLabel}>{tool.label}</span>
                    </button>
                ))}
            </div>

            {/* Color dots — only for relevant tools */}
            {["text", "draw"].includes(activeTool) && (
                <div style={styles.colorPicker}>
                    {["#000000", "#ff4d00", "#ff0000", "#0055ff", "#008000", "#ffff00", "#ff69b4", "#ffffff"].map((color) => (
                        <div
                            key={color}
                            onClick={() => setActiveColor(color)}
                            style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                background: color,
                                cursor: "pointer",
                                border: activeColor === color
                                    ? "2px solid #fff"
                                    : "2px solid #444",
                                transform: activeColor === color ? "scale(1.3)" : "scale(1)",
                                transition: "all 0.15s",
                                flexShrink: 0,
                            }}
                        />
                    ))}
                    {/* Custom color */}
                    <input
                        type="color"
                        value={activeColor}
                        onChange={(e) => setActiveColor(e.target.value)}
                        style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            border: "2px solid #444",
                            cursor: "pointer",
                            padding: 0,
                            background: "none",
                        }}
                        title="Custom color"
                    />
                </div>
            )}
        </div>

        {/* Right — export */}
        <button style={styles.exportBtn} onClick={handleExport}>
            EXPORT PDF ↓
        </button>
    </div>
);
}

const styles = {
  toolbar: {
    height: "56px",
    background: "#0f0f0f",
    borderBottom: "1px solid #1f1f1f",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.5rem",
    gap: "1rem",
  },
  filename: {
    color: "#555",
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",
  },
  accent: { color: "#ff4d00" },
  tools: {
    display: "flex",
    gap: "0.25rem",
  },
  toolBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "none",
    border: "1px solid transparent",
    borderRadius: "3px",
    color: "#555",
    cursor: "pointer",
    padding: "0.4rem 0.75rem",
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    transition: "all 0.15s",
  },
  toolBtnActive: {
    background: "#1a0a00",
    border: "1px solid #ff4d00",
    color: "#ff4d00",
  },
  toolIcon: { fontSize: "0.9rem" },
  toolLabel: { fontFamily: "'Courier New', monospace" },
  exportBtn: {
    background: "#ff4d00",
    border: "none",
    borderRadius: "3px",
    color: "#fff",
    cursor: "pointer",
    padding: "0.5rem 1rem",
    fontSize: "0.7rem",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.1em",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  centerGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
},
colorPicker: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    paddingLeft: "0.75rem",
    borderLeft: "1px solid #2a2a2a",
},
};