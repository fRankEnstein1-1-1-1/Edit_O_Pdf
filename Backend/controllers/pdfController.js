const Document = require("../models/Document");
const { getBucket } = require("../config/db");
const mongoose = require("mongoose");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

// ─── HELPER: Download PDF buffer from GridFS ───────────────────────────────
const getPdfBuffer = (bucket, fileId) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
        stream.on("data", chunk => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
};

// ─── HELPER: Delete file from GridFS ──────────────────────────────────────
const deleteFromGridFS = async (bucket, fileId) => {
    try {
        await bucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (err) {
        // If file not found in GridFS, just continue — orphaned record
        if (err.message.includes("File not found")) return;
        throw new Error(`GridFS delete failed: ${err.message}`);
    }
};

// ─── HELPER: Upload buffer to GridFS ──────────────────────────────────────
const uploadToGridFS = (bucket, buffer, filename) => {
    return new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: "application/pdf"
        });
        uploadStream.end(buffer);
        uploadStream.on("finish", () => resolve(uploadStream.id));
        uploadStream.on("error", reject);
    });
};

// ─── UPLOAD ────────────────────────────────────────────────────────────────
exports.uploadPdf = async (req, res) => {
    try {
        const { file } = req;
        if (!file) return res.status(400).json({ error: "No file uploaded" });

        const bucket = getBucket();

        const uploadStream = bucket.openUploadStream(
            `${Date.now()}-${file.originalname}`,
            { contentType: "application/pdf" }
        );

        uploadStream.end(file.buffer);

        uploadStream.on("finish", async () => {
            // Count pages using pdf-lib
           const pdfDoc = await PDFDocument.load(file.buffer, { 
    ignoreEncryption: true,
    throwOnInvalidObject: false 
});
            const totalPages = pdfDoc.getPageCount();

            const doc = await Document.create({
                filename: uploadStream.filename,
                originalName: file.originalname,
                fileId: uploadStream.id,
                totalPages,
            });

            res.status(201).json({ message: "Uploaded!", document: doc });
        });

        uploadStream.on("error", (err) => {
            res.status(500).json({ error: err.message });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── GET ALL ───────────────────────────────────────────────────────────────
exports.getAllPdfs = async (req, res) => {
    try {
        const docs = await Document.find().sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── STREAM PDF FILE ───────────────────────────────────────────────────────
exports.getPdf = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        const bucket = getBucket();
        const stream = bucket.openDownloadStream(doc.fileId);
        res.setHeader("Content-Type", "application/pdf");
        stream.pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── DELETE DOCUMENT ───────────────────────────────────────────────────────
exports.deletePdf = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        const bucket = getBucket();
        await deleteFromGridFS(bucket, doc.fileId);
        await Document.findByIdAndDelete(req.params.id);

        res.json({ message: "Deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── ADD PAGE ──────────────────────────────────────────────────────────────
exports.addPage = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        const bucket = getBucket();
        const pdfBuffer = await getPdfBuffer(bucket, doc.fileId);
       const pdfDoc = await PDFDocument.load(pdfBuffer, { 
    ignoreEncryption: true,
    throwOnInvalidObject: false 
});
        // Add blank page with same size as first page
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();
        pdfDoc.addPage([width, height]);

        const modifiedBuffer = Buffer.from(await pdfDoc.save());

        // Delete old file, upload new one
        await deleteFromGridFS(bucket, doc.fileId);
        const newFileId = await uploadToGridFS(bucket, modifiedBuffer, doc.filename);

        doc.fileId = newFileId;
        doc.totalPages = pdfDoc.getPageCount();
        await doc.save();

        res.json({ message: "Page added!", totalPages: doc.totalPages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── DELETE PAGE ───────────────────────────────────────────────────────────
exports.deletePage = async (req, res) => {
    try {
        const pageIndex = parseInt(req.params.pageIndex);
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        if (doc.totalPages <= 1) return res.status(400).json({ error: "Cannot delete the only page" });

        const bucket = getBucket();
        const pdfBuffer = await getPdfBuffer(bucket, doc.fileId);
       const pdfDoc = await PDFDocument.load(pdfBuffer, { 
    ignoreEncryption: true,
    throwOnInvalidObject: false 
});

        if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
            return res.status(400).json({ error: "Invalid page index" });
        }

        pdfDoc.removePage(pageIndex);

        const modifiedBuffer = Buffer.from(await pdfDoc.save());

        await deleteFromGridFS(bucket, doc.fileId);
        const newFileId = await uploadToGridFS(bucket, modifiedBuffer, doc.filename);

        doc.fileId = newFileId;
        doc.totalPages = pdfDoc.getPageCount();

        // Remove annotations for deleted page, shift others down
        const updatedAnnotations = {};
        for (const [key, value] of doc.annotations) {
            const k = parseInt(key);
            if (k === pageIndex) continue;
            if (k > pageIndex) updatedAnnotations[k - 1] = value;
            else updatedAnnotations[k] = value;
        }
        doc.annotations = updatedAnnotations;

        await doc.save();
        res.json({ message: "Page deleted!", totalPages: doc.totalPages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── SAVE ANNOTATIONS ─────────────────────────────────────────────────────
// Body: { pageIndex: 0, annotations: [...] }
// Annotation object: { type, x, y, content, fontSize, color, width, height }
exports.saveAnnotations = async (req, res) => {
    try {
        const { pageIndex, annotations } = req.body;
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        doc.annotations.set(String(pageIndex), annotations);
        await doc.save();

        res.json({ message: "Annotations saved!", annotations: doc.annotations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── EXPORT PDF ────────────────────────────────────────────────────────────
exports.exportPdf = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });

    const bucket = getBucket();
    const pdfBuffer = await getPdfBuffer(bucket, doc.fileId);
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const annotationsData = doc.annotations || {};
    const entries = annotationsData instanceof Map
      ? Array.from(annotationsData.entries())
      : Object.entries(annotationsData);

  for (const [pageIndexStr, annotations] of entries) {
  const pageIndex = parseInt(pageIndexStr);
  const page = pdfDoc.getPage(pageIndex);
  const { width: pdfWidth, height: pdfHeight } = page.getSize();

  // White boxes first
  for (const ann of annotations || []) {
    if (ann.type === "whitebox") {
      page.drawRectangle({
        x: ann.x,
        y: pdfHeight - ann.y - ann.height,   // y-flip
        width: ann.width,
        height: ann.height,
        color: rgb(1, 1, 1),
      });
    }
  }

  // Text & Images
  for (const ann of annotations || []) {
    if (ann.type === "text") {
      const [r, g, b] = hexToRgb(ann.color || "#000000");
      page.drawText(ann.content, {
        x: ann.x,
        y: pdfHeight - ann.y - (ann.fontSize * 0.9), // baseline fix
        size: ann.fontSize,
        font,
        color: rgb(r, g, b),
      });
    }

    if (ann.type === "image") {
      const imageBytes = Buffer.from(ann.imageData, "base64");
      const embedded = await pdfDoc.embedPng(imageBytes);

      page.drawImage(embedded, {
        x: ann.x,
        y: pdfHeight - ann.y - ann.height,
        width: ann.width,
        height: ann.height,
      });
    }
  }
}

    const finalBuffer = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="edited-${doc.originalName || 'document.pdf'}"`);
    res.send(Buffer.from(finalBuffer));
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: err.message });
  }
};
// ─── HELPER: Hex to RGB ────────────────────────────────────────────────────
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
          ]
        : [0, 0, 0];
};