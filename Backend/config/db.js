const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let bucket;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(` MongoDB Connected: ${conn.connection.host}`);
        
        // Initialize GridFS bucket
        bucket = new GridFSBucket(conn.connection.db, {
            bucketName: "pdfs"
        });
        console.log(" GridFS Ready");

    } catch (error) {
        console.log(` DB Connection Failed: ${error.message}`);
        process.exit(1);
    }
}

// So other files can access the bucket
const getBucket = () => bucket;

module.exports = { connectDB, getBucket };