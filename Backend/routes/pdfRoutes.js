const express = require("express")
const { uploadPdf, getPdf, getAllPdfs, deletePdf } = require("../controllers/pdfController")
const upload = require("../middleware/upload")
const router = express.Router();


router.post("/upload", upload.single("pdf"), uploadPdf);
router.get("/", getAllPdfs);
router.get("/:id", getPdf);
router.delete("/:id", deletePdf);
module.exports = router;