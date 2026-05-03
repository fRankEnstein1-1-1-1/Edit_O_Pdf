const express = require("express");
const dotenv  = require("dotenv");
dotenv.config();
const morgan = require('morgan')
const cors = require('cors')
const pdfRoutes = require('./routes/pdfRoutes')
const app = express()
const {connectDB} = require("./config/db")
app.use(express.json())
app.use(morgan('dev'))
app.use(cors())
app.get("/",(req,res)=>{res.json({message:"Live"})})
app.use("/api/pdf",pdfRoutes)
connectDB()
app.listen(5000,()=>{console.log("Express is running")})