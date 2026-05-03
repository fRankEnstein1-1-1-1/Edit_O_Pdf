const Document = require("../models/Document");
const { getBucket } = require("../config/db");
const mongoose = require("mongoose");

// Upload
exports.uploadPdf = async (req, res) => {
    try {
        const { file } = req;
        if (!file) return res.status(400).json({ error: "No file uploaded" });

        const bucket = getBucket();

        // Manually stream buffer into GridFS
        const uploadStream = bucket.openUploadStream(
            `${Date.now()}-${file.originalname}`,
            { contentType: "application/pdf" }
        );

        uploadStream.end(file.buffer);

        uploadStream.on("finish", async () => {
            const doc = await Document.create({
                filename: uploadStream.filename,
                originalName: file.originalname,
                fileId: uploadStream.id,
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

// Get all
exports.getAllPdfs = async (req, res) => {
    try {
        const docs = await Document.find().sort({ createdAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Stream PDF file
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

// Delete
exports.deletePdf = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });

        const bucket = getBucket();
        await bucket.delete(doc.fileId);
        await Document.findByIdAndDelete(req.params.id);

        res.json({ message: "Deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};