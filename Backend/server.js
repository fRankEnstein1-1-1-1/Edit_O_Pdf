const express = require("express");
const dotenv  = require("dotenv");
dotenv.config();
const morgan = require('morgan')
const cors = require('cors')
const pdfRoutes = require('./routes/pdfRoutes')
const app = express()
const {connectDB} = require("./config/db")
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(morgan('dev'))
app.use(cors())
app.get("/",(req,res)=>{res.json({message:"Live"})})
app.use("/api/pdf",pdfRoutes)
connectDB()
app.listen(5000,()=>{console.log("Express is running")})