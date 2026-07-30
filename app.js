require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT
const cors = require("cors")
const {connectDB} = require("./src/config/database")
const uploadErrorHandler = require("./src/middleware/errorMutlerHandler")
const routes = require("./src/routes/route")
const authRoutes = require("./src/routes/authRoutes")
const { connectRedis } = require("./src/config/redis")
const helmet = require("helmet")

connectDB()
connectRedis()

app.use(cors({
  origin: ['https://studyhub-matw.onrender.com/'], // mendukung origin tanpa dan dengan slash di akhir
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json())
app.use('/uploads', express.static('uploads'));

app.use(helmet())
app.use('/', routes)
app.use('/auth', authRoutes)
app.use(uploadErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
