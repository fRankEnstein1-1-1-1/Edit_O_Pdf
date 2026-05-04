const express = require("express");
const router = express.Router();
const {
    uploadPdf,
    getPdf,
    getAllPdfs,
    deletePdf,
    addPage,
    deletePage,
    saveAnnotations,
    exportPdf
} = require("../controllers/pdfController");
const upload = require("../middleware/upload");

router.post("/upload", upload.single("pdf"), uploadPdf);
router.get("/", getAllPdfs);
router.get("/:id/file", getPdf);
router.delete("/:id", deletePdf);


router.post("/:id/pages/add", addPage);
router.delete("/:id/pages/:pageIndex", deletePage);
router.post("/:id/annotate", saveAnnotations);
router.get("/:id/export", exportPdf);

module.exports = router;