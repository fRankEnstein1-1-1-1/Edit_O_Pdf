# EDIT\_Ω\_PDF

> A free, web-based PDF editor built with the MERN stack. No installation. No subscription. Just upload, edit, and export.

---

## The Problem

As a student, every assignment needs to be submitted as a PDF. But editing a PDF directly? Nearly impossible without paid tools. The free ones need local installation. So the usual workflow becomes:

```
Convert PDF to Word → Edit Word → Convert back to PDF
```

That's too much work for a simple edit. So I built Edit_O_PDF.

---

## Live Demo

🔗 **[edit-o-pdf.vercel.app](https://your-deployment-link)**

> Note: The backend is hosted on Render's free tier. It may take 30–60 seconds to spin up on the first request. Please be patient!

---

## Preview

![Edit_O_PDF Demo](./preview.gif)

---

## Features

| Feature | Status |
|---|---|
| Upload any PDF 
| Multi-page viewer with thumbnail sidebar 
| Add text anywhere on the page 
| Eraser tool (white box) to cover existing text 
| Free drawing with color picker
| Insert images into pages 
| Add blank pages 
| Delete pages 
| Delete individual annotations 
| Export and download edited PDF 
| Color picker for text and drawing tools 
| Tutorial page for first-time users 

---

## Tech Stack

### Frontend
- **React.js** (Vite) — UI framework
- **pdf.js** (Mozilla) — Renders PDF pages as canvas
- **Fabric.js** — Powers the annotation and drawing layer on top of the PDF
- **Axios** — API communication
- **React Router** — Client-side routing

### Backend
- **Node.js + Express.js** — REST API
- **MongoDB Atlas** — Database
- **GridFS** — Stores PDF binaries in MongoDB (chunked, no size limit)
- **pdf-lib** — PDF manipulation (add pages, embed text, images, drawings)
- **Multer** — Handles multipart file uploads
- **Mongoose** — MongoDB ODM

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│                                             │
│  UploadPage → EditorPage                    │
│               ├── TopToolbar                │
│               ├── PageSidebar (thumbnails)  │
│               └── EditorCanvas             │
│                   ├── pdf.js layer         │
│                   └── Fabric.js layer      │
└──────────────────────┬──────────────────────┘
                       │ Axios
┌──────────────────────▼──────────────────────┐
│              Express REST API                │
│                                             │
│  POST   /api/pdf/upload                     │
│  GET    /api/pdf                            │
│  GET    /api/pdf/:id/file                   │
│  DELETE /api/pdf/:id                        │
│  POST   /api/pdf/:id/pages/add              │
│  DELETE /api/pdf/:id/pages/:pageIndex       │
│  POST   /api/pdf/:id/annotate               │
│  GET    /api/pdf/:id/export                 │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│              MongoDB Atlas                   │
│                                             │
│  fs.files   ← PDF binary chunks (GridFS)   │
│  fs.chunks  ← PDF binary chunks (GridFS)   │
│  documents  ← metadata + annotations       │
└─────────────────────────────────────────────┘
```

---

## How Editing Works

PDFs are not like Word documents — you can't directly modify existing text. Here's how Edit_O_PDF handles it:

```
User places white box over existing text   ← hides original text
User types new text on top of white box    ← appears as replacement
On Export → pdf-lib merges all layers      ← clean final PDF
```

Annotations are stored as JSON in MongoDB and only merged into the PDF on export. This keeps the original file intact until you're ready to download.

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Clone the repo

```bash
git clone https://github.com/yourusername/edit-o-pdf.git
cd edit-o-pdf
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api/pdf
```

Start the frontend:
```bash
npm run dev
```

Open `http://localhost:5173`

---

## Project Structure

```
edit-o-pdf/
├── backend/
│   ├── config/
│   │   └── db.js              ← MongoDB + GridFS connection
│   ├── controllers/
│   │   └── pdfController.js   ← All PDF operations
│   ├── middleware/
│   │   └── upload.js          ← Multer memory storage
│   ├── models/
│   │   └── Document.js        ← Mongoose schema
│   ├── routes/
│   │   └── pdfRoutes.js       ← API routes
│   └── server.js
│
└── frontend/
    └── src/
        ├── api/
        │   └── pdfApi.js      ← Axios API calls
        ├── components/
        │   ├── TopToolbar.jsx
        │   ├── PageSidebar.jsx
        │   └── EditorCanvas.jsx
        ├── pages/
        │   ├── UploadPage.jsx
        │   ├── EditorPage.jsx
        │   └── TutorialPage.jsx
        └── App.jsx
```

---

## Known Limitations

### Annotation Offset
Text and whitebox annotations have a slight positional offset in the exported PDF compared to the canvas preview. This is caused by a coordinate system mismatch between:
- **Fabric.js** — uses screen pixels, top-left origin
- **pdf-lib** — uses PDF points, bottom-left origin
- **Device Pixel Ratio** — retina displays (2x) add an extra layer of complexity

The **drawing tool exports perfectly** as paths are stored with absolute coordinates.

This is a known issue and is actively being worked on. Contributions and suggestions are welcome!

### No Authentication
This is a single-user portfolio project. There is no login system — all uploaded PDFs are accessible via their document ID.

---

## What I Learned

- **GridFS** — how MongoDB stores large binary files in chunks
- **pdf.js** — rendering PDF pages as canvas elements in the browser
- **Fabric.js** — building interactive canvas layers with objects, events, and transforms
- **pdf-lib** — programmatic PDF manipulation on the backend
- **Coordinate systems** — the surprisingly complex world of mapping canvas pixels to PDF points

---

## Contributing

Found a bug? Raise a issue
