import axios from "axios";

const API = axios.create({
  baseURL: "https://edit-o-pdf.onrender.com/api/pdf",
});
//http://localhost:5000/api/pdf
// https://edit-o-pdf.onrender.com/api
//  Upload PDF

export const uploadPdf = (formData) =>
  API.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });


//  Get All PDFs

export const getAllPdfs = () =>
  API.get("/");


// Get PDF File (stream)

export const getPdfFile = (id) =>
  API.get(`/${id}/file`, {
    responseType: "blob", // important for PDF
  });


//  Delete PDF

export const deletePdf = (id) =>
  API.delete(`/${id}`);


//  Add Page

export const addPage = (id) =>
  API.post(`/${id}/pages/add`);


//  Delete Page

export const deletePage = (id, pageIndex) =>
  API.delete(`/${id}/pages/${pageIndex}`);


//  Save Annotations

export const saveAnnotations = (id, pageIndex, annotations) =>
  API.post(`/${id}/annotate`, {
    pageIndex,
    annotations,
  });


//  Export PDF

export const exportPdf = (id) =>
  API.get(`/${id}/export`, {
    responseType: "blob",
  });