const mongoose = require("mongoose");


const documentSchema = mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID
    totalPages: { type: Number, default: 0 },
    annotations: { type: Map, of: Array, default: {} }, // { "0": [], "1": [] } page-wise
},{timestamps : true});
module.exports =mongoose.model("Document",documentSchema)