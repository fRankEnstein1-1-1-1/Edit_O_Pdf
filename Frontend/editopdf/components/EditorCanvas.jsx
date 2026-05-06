import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Canvas, IText, Rect, FabricImage,PencilBrush } from "fabric";
import { saveAnnotations } from "../api/pdfApi";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

export default function EditorCanvas({ id, document: pdfDocument, currentPage, activeTool, activeColor })  {
  const canvasEl = useRef(null);
  const fabricRef = useRef(null);
  const containerRef = useRef(null);
  const scaleRef = useRef(1);

  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activeToolRef = useRef(activeTool);
const activeColorRef = useRef(activeColor);
useEffect(() => {
    activeColorRef.current = activeColor;
}, [activeColor]);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

 const calculateOptimalScale = useCallback((pdfPage) => {
    if (!containerRef.current) return 1.2;
    const containerWidth = containerRef.current.clientWidth - 32;
    const viewportAt1 = pdfPage.getViewport({ scale: 1 });
    const scaleToFit = containerWidth / viewportAt1.width;
    return Math.min(Math.max(scaleToFit, 0.5), 2.0);
}, []);

const loadPage = async () => {
  if (!pdfDocument || currentPage === undefined || !canvasEl.current) return;

  setIsLoading(true);

  try {
    const response = await fetch(`https://edit-o-pdf.onrender.com/api/pdf/${id}/file`);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(currentPage + 1);

    // ===============================
    // 📐 ORIGINAL PDF SIZE
    // ===============================
    const originalViewport = page.getViewport({ scale: 1 });

    // ===============================
    // 🎯 SCALE (VERY IMPORTANT)
    // ===============================
    const scale = calculateOptimalScale(page);
    scaleRef.current = scale;

    const viewport = page.getViewport({ scale });

    // ===============================
    // 🧠 STORE DIMENSIONS (FINAL CLEAN VERSION)
    // ===============================
    window.currentPageOriginalSize = {
      pdfWidth: originalViewport.width,
      pdfHeight: originalViewport.height,
      canvasWidth: viewport.width,
      canvasHeight: viewport.height,
      ratio: originalViewport.width / viewport.width, // 🔥 IMPORTANT
    };

    // ===============================
    // 🖼 RENDER PDF → TEMP CANVAS
    // ===============================
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;

    const ctx = tempCanvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    // ===============================
    // ♻️ CLEAN OLD FABRIC
    // ===============================
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    // ===============================
    // 🎨 CREATE FABRIC CANVAS
    // ===============================
    const fabricCanvas = new Canvas(canvasEl.current, {
      width: viewport.width,
      height: viewport.height,
      selection: true,
    });

    fabricRef.current = fabricCanvas;

    // ===============================
    // 🖼 BACKGROUND IMAGE (FIXED)
    // ===============================
 // Inside loadPage(), after rendering the tempCanvas

const dataUrl = tempCanvas.toDataURL("image/png");
const bgImage = await FabricImage.fromURL(dataUrl);

bgImage.set({
  left: 0,
  top: 0,
  originX: "left",
  originY: "top",
  selectable: false,
  evented: false,
});

fabricCanvas.backgroundImage = bgImage;

// 🔥 CRITICAL ALIGNMENT FIXES
fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
fabricCanvas.absolutePan({ x: 0, y: 0 });

fabricCanvas.renderAll();

console.log("Canvas initialized with width:", viewport.width);

// Store exact sizes
// window.currentPageOriginalSize = {
//   pdfWidth: originalViewport.width,
//   pdfHeight: originalViewport.height,
//   canvasWidth: viewport.width,
// };
    // ===============================
    // 🖱 TOOL HANDLER
    // ===============================
    fabricCanvas.on("mouse:down", (opt) => {
      const tool = activeToolRef.current;
          // DELETE tool
   if (tool === "delete") {
    if (opt.target) {
      fabricCanvas.remove(opt.target);
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      console.log("Annotation deleted");
      
      // Optional: Auto switch back to select after deleting annotation
      // setActiveTool("select");   // Uncomment if you want
    }
    return;
  }

      if (opt.target && tool === "select") return;
      if (opt.target && tool !== "text") return;

      const pointer = fabricCanvas.getScenePoint(opt.e);

      // TEXT
   if (tool === "text") {
    const text = new IText("Type here...", {
        left: pointer.x,
        top: pointer.y,
        fontSize: 18,
        fill: activeColorRef.current, 
        fontFamily: "Arial",
    });
    fabricCanvas.add(text);
    fabricCanvas.bringObjectToFront(text); // ← v7 syntax
    fabricCanvas.setActiveObject(text);
    text.enterEditing();
    fabricCanvas.renderAll();
}

      // WHITEBOX
     if (tool === "whitebox" && !opt.target) {
    const rect = new Rect({
        left: pointer.x,
        top: pointer.y,
        width: 300,   // ← bigger
        height: 60,   // ← bigger
         fill: "#ffffff",  // ← always white for eraser
        stroke: activeColorRef.current,  // ← colored border
        strokeWidth: 1,
         selectable: true,  // ← add
    evented: true,     // ← add
    hasControls: true, // ← add
    });
        fabricCanvas.add(rect);
        fabricCanvas.setActiveObject(rect);
        fabricCanvas.renderAll();
      }
    });

  } catch (err) {
    console.error("Page load error:", err);
  } finally {
    setIsLoading(false);
  }
};

  // Load when page changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPage();
    }, 100); // Small delay ensures DOM is ready

    return () => clearTimeout(timeoutId);
  }, [pdfDocument, currentPage]);

  // Tool mode changes
 useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.isDrawingMode = activeTool === "draw";
    if (activeTool === "draw") {
        const brush = new PencilBrush(canvas);
        brush.color = activeColor;  // ← use activeColor
        brush.width = 3;
        canvas.freeDrawingBrush = brush;
    }
}, [activeTool, activeColor]);  // ← add activeColor dependency

  // Resize handler
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (pdfDocument && currentPage !== undefined) loadPage();
      }, 300);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, [pdfDocument, currentPage]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const img = await FabricImage.fromURL(evt.target.result);
      img.scaleToWidth(200);
      fabricRef.current.add(img);
      fabricRef.current.renderAll();
    };
    reader.readAsDataURL(file);
  };

const handleSave = async () => {
  if (!fabricRef.current) return;
  setSaving(true);

  try {
    const canvas = fabricRef.current;
    const orig = window.currentPageOriginalSize;
    const ratio = orig.pdfWidth / canvas.getWidth();

    const annotations = canvas.getObjects().map((obj,index) => {
      const left = obj.left || 0;
      const top = obj.top || 0;
      const w = (obj.width || 0) * (obj.scaleX || 1);
      const h = (obj.height || 0) * (obj.scaleY || 1);

     const pdfX = Math.max(0, Math.round(left * ratio) - 33);  // was -37, reduced
const pdfY = Math.max(0, Math.round(top * ratio)-17 )   // was -7, increased        // ← NO FLIP (Top-left)

      console.log(`Saving ${obj.type} at PDF(${pdfX}, ${pdfY})  [canvas: ${left.toFixed(1)},${top.toFixed(1)}]`);

      if (obj.type === "rect" || obj.type === "whitebox") {
        return {
          type: "whitebox",
          x: pdfX,
          y: pdfY,
          width: Math.round(w * ratio),
          height: Math.round(h * ratio),
          zindex:index,
        };
      }

      if (obj.type === "i-text" || obj.type === "textbox") {
         console.log("Text content:", obj.text);
    console.log("Text coords:", pdfX, pdfY);
    console.log("Font size:", obj.fontSize, "scaleX:", obj.scaleX);
        return {
          type: "text",
          x: pdfX,
          y: pdfY,
          content: obj.text || "Sample Text",
        fontSize: Math.round((obj.fontSize * (obj.scaleX || 1)) * ratio),
          color: obj.fill || "#000000",
          zindex: index,
        };
      }

      if (obj.type === "path") {
    // Scale the entire path array by ratio
    const scaledPath = obj.path.map(cmd => {
        const command = [...cmd];
        // First element is the command letter (M, L, C, Q, Z etc)
        // Rest are coordinate pairs
        for (let i = 1; i < command.length; i++) {
            command[i] = command[i] * ratio;
        }
        return command;
    });

    return {
        type: "drawing",
        x: 0,  // ← set to 0, path coords are absolute
        y: 0,  // ← set to 0, path coords are absolute
        path: scaledPath,
        stroke: obj.stroke || "#ff4d00",
        strokeWidth: (obj.strokeWidth || 3) * ratio,
    };
    
}

if (obj.type === "image") {
    const dataUrl = obj.toDataURL();
    const base64 = dataUrl.split(",")[1];
    return {
        type: "image",
        x: pdfX,
        y: pdfY,
        width: Math.round(w * ratio),
        height: Math.round(h * ratio),
        imageData: base64,
        mimeType: "image/png",
    };
}
      return null;
    }).filter(Boolean);

    console.log("Sending:", annotations);
    await saveAnnotations(id, currentPage, annotations);

    
    alert("Saved! Check the downloaded PDF.");
  } catch (e) {
    console.error(e);
    alert("Save failed");
  } finally {
    setSaving(false);
  }
};
  return (
    <div style={styles.wrapper}>
      <input
        id="imageUpload"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />

      <div ref={containerRef} style={styles.canvasArea}>
        {isLoading && <div style={styles.loading}>Loading page...</div>}

        <div id="canvas-host" style={styles.canvasHost}>
          <canvas ref={canvasEl} />
        </div>
      </div>

      <div style={styles.bottomBar}>
        <span style={styles.hint}>
          {activeTool === "text" && "Click anywhere to add text • "}
          {activeTool === "whitebox" && "Click to cover content • "}
          {activeTool === "draw" && "Free drawing mode • "}
          {activeTool === "select" && "Click objects to select & move"}
        </span>

        <div style={styles.bottomActions}>
          {activeTool === "image" && (
            <button style={styles.insertBtn} onClick={() => document.getElementById("imageUpload").click()}>
              INSERT IMAGE
            </button>
          )}
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? "SAVING..." : "SAVE PAGE ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#141414",
  },
  canvasArea: {
    flex: 1,
    overflow: "auto",
    background: "#1a1a1a",
    padding: "2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  canvasHost: {
    position: "relative",
    boxShadow: "0 15px 50px rgba(0,0,0,0.7)",
    border: "1px solid #444",
  },
  loading: {
    color: "#888",
    marginTop: "4rem",
    fontSize: "1.1rem",
  },
  bottomBar: {
    height: "52px",
    background: "#0f0f0f",
    borderTop: "1px solid #222",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1.5rem",
  },
  hint: { color: "#666", fontSize: "0.8rem" },
  bottomActions: { display: "flex", gap: "10px" },
  insertBtn: {
    background: "none",
    border: "1px solid #666",
    color: "#ccc",
    padding: "6px 14px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#ff4d00",
    border: "none",
    color: "white",
    padding: "7px 18px",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};