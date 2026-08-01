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
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');

connectDB()
connectRedis()

app.use(cors({
  origin: ["http://localhost:5173", "https://studyhub-matw.vercel.app"], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Batasi ukuran JSON payload maksimal 10kb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/uploads', express.static('uploads'));

// Sanitasi data dari NoSQL Injection
app.use(mongoSanitize());

// Sanitasi data dari script berbahaya (XSS)
app.use(xss());

// middleware express yang menambahkan header keamanan HTTP
app.use(helmet())

// Mengkompres semua response JSON & teks dari server sebelum dikirim ke pengguna. 
app.use(compression());

app.use('/', routes)
app.use('/auth', authRoutes)
app.use(uploadErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
