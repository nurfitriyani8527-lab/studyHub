# 📚 StudyHub AI — Backend

Backend dari **StudyHub AI**, sebuah platform pembelajaran berbasis AI yang membantu pengguna mengolah materi pembelajaran menjadi **ringkasan dan quiz secara otomatis**.

Backend ini bertanggung jawab untuk menangani authentication, file upload, penyimpanan data, pemrosesan materi, caching, queue, serta integrasi dengan AI.

Backend dibuat menggunakan **Node.js dan Express.js** dengan **MongoDB** sebagai database.

---

## ✨ Features

* 🔐 User authentication & authorization
* 🔑 JWT authentication
* 🔒 Password hashing menggunakan bcrypt
* 📄 File upload
* 📖 Text extraction dari materi
* 🤖 AI-generated summary
* 📝 AI-generated quiz
* ⚡ Redis caching
* 📦 Background job processing menggunakan BullMQ
* 👷 Worker untuk memproses background jobs
* ✅ Request validation
* 📊 Status tracking untuk proses materi
* 🗄️ MongoDB database
* 🚨 Error handling pada API

---

## 🛠️ Tech Stack

### Backend

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**

### Authentication & Security

* **JWT (JSON Web Token)**
* **bcrypt**
* **express-validation**

### Queue & Caching

* **Redis**
* **BullMQ**

### AI

* **OpenRouter**
* AI model untuk generate summary dan quiz

### File Processing

* **Multer**
* PDF / DOCX text extraction

---

## 🏗️ Backend Architecture

Backend menggunakan beberapa service untuk memisahkan tanggung jawab dari setiap proses.

Secara sederhana:

```text
                    ┌──────────────┐
                    │   Frontend   │
                    │    React     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Express    │
                    │     API      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          MongoDB       Redis        BullMQ
              │            │            │
              │            │            ▼
              │            │         Worker
              │            │            │
              │            │            ▼
              │            │       AI Processing
              │            │            │
              │            │            ▼
              └────────────┴─────── OpenRouter
```

---

## 🔐 Authentication

StudyHub AI menggunakan **JWT (JSON Web Token)** untuk authentication.

Flow authentication:

```text
Register
   │
   ▼
Password
   │
   ▼
bcrypt hashing
   │
   ▼
MongoDB
```

Ketika user login:

```text
User Login
    │
    ▼
Check User
    │
    ▼
bcrypt.compare()
    │
    ▼
Generate JWT
    │
    ▼
Return Token
```

Token kemudian digunakan untuk mengakses endpoint yang membutuhkan authentication.

---

## 🔒 Password Security

Password user tidak disimpan dalam bentuk plain text.

Sebelum disimpan ke database, password akan diproses menggunakan **bcrypt** sehingga yang disimpan adalah hasil hash password.

Contoh:

```text
Password
   │
   ▼
bcrypt.hash()
   │
   ▼
Hashed Password
   │
   ▼
MongoDB
```

Ketika login, password yang diberikan user akan dibandingkan dengan hash yang tersimpan menggunakan `bcrypt.compare()`.

---

## 📄 File Upload

Backend menggunakan **Multer** untuk menangani proses upload file.

File yang diupload akan diproses untuk mengambil text dari materi.

Flow:

```text
User
 │
 ▼
Upload File
 │
 ▼
Multer
 │
 ▼
Validate File
 │
 ▼
Save File Information
 │
 ▼
Queue
 │
 ▼
Worker
 │
 ▼
Text Extraction
```

File yang berhasil diproses kemudian dapat digunakan untuk generate summary dan quiz.

---

## 📦 BullMQ & Background Processing

Beberapa proses dalam StudyHub AI membutuhkan waktu cukup lama, terutama:

* Text extraction
* Generate summary
* Generate quiz
* AI processing

Daripada menjalankan seluruh proses tersebut secara langsung di request utama, backend menggunakan **BullMQ** untuk membuat background job.

Contoh flow:

```text
Upload Material
      │
      ▼
Create Job
      │
      ▼
 BullMQ Queue
      │
      ▼
    Worker
      │
      ├── Extract Text
      │
      ├── Generate Summary
      │
      └── Generate Quiz
```

Dengan pendekatan ini, API tidak perlu menunggu seluruh proses AI selesai sebelum memberikan response kepada frontend.

---

## 👷 Worker

Worker bertugas mengambil job dari BullMQ dan menjalankan proses background.

Contohnya:

```text
BullMQ
   │
   ▼
Worker
   │
   ├── Find Material
   │
   ├── Extract Text
   │
   ├── Save Material
   │
   ├── Generate Summary
   │
   └── Generate Quiz
```

Worker dijalankan sebagai proses terpisah dari Express API.

---

## ⚡ Redis Caching

Redis digunakan untuk melakukan **caching** terhadap data tertentu.

Tujuannya untuk mengurangi proses pengambilan atau pemrosesan data yang sama secara berulang.

Flow sederhana:

```text
Request
   │
   ▼
Check Redis
   │
   ├── Cache Hit
   │      │
   │      ▼
   │   Return Data
   │
   └── Cache Miss
          │
          ▼
       MongoDB
          │
          ▼
      Save Cache
          │
          ▼
      Return Data
```

Dengan caching, beberapa request dapat dilayani tanpa harus selalu mengambil data langsung dari database.

---

## 🤖 AI Integration

StudyHub AI menggunakan **OpenRouter** untuk menghubungkan backend dengan AI model.

AI digunakan untuk menghasilkan:

### 📖 Summary

Materi yang sudah diekstrak dikirim ke AI untuk menghasilkan ringkasan materi.

### 📝 Quiz

Materi juga digunakan sebagai input untuk menghasilkan quiz secara otomatis.

Quiz dapat berisi:

* Pertanyaan
* Pilihan A-D
* Jawaban yang benar
* Penjelasan

Flow:

```text
Material Text
     │
     ▼
Chunking / Processing
     │
     ▼
AI Service
     │
     ▼
OpenRouter
     │
     ▼
AI Response
     │
     ▼
Parse & Validate
     │
     ▼
MongoDB
```

---

## 🗄️ Database

Backend menggunakan **MongoDB** sebagai database dan **Mongoose** sebagai ODM.

Beberapa data yang disimpan antara lain:

* User
* File
* Material
* Summary
* Quiz

Relasi antar data digunakan untuk menghubungkan user dengan materi serta hasil pemrosesan materi.

---

## 📂 Project Structure

Struktur backend secara umum:

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js
│   │   └── redisQueue.js
│   │
│   ├── controller/
│   │
│   ├── middleware/
│   │
│   ├── model/
│   │
│   ├── routes/
│   │
│   ├── service/
│   │   ├── ai/
│   │   ├── quiz/
│   │   └── ringkasan/
│   │
│   ├── workers/
│   │
│   └── ...
│
├── uploads/
│
├── .env
├── package.json
└── README.md
```

Struktur dapat berubah sesuai dengan perkembangan project.

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone <repository-url>
```

Masuk ke folder backend:

```bash
cd studyhub-ai-backend
```

### 2. Install Dependencies

```bash
npm install
```

---

## 🔑 Environment Variables

Buat file `.env` pada root project.

Contoh:

```env
PORT=5000

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_jwt_secret

REDIS_URL=your_redis_url

OPENROUTER_API_KEY=your_openrouter_api_key
```

Sesuaikan nama environment variable dengan konfigurasi pada project.

> Jangan commit file `.env` ke repository karena berisi informasi sensitif seperti database credentials dan API key.

---

## ▶️ Running the Backend

### Run API Server

```bash
npm run dev
```

Atau jika menggunakan Node secara langsung:

```bash
node src/server.js
```

### Run Worker

Worker dijalankan secara terpisah:

```bash
node src/workers/uploadWorker.js
```

Pastikan Redis sudah berjalan sebelum menjalankan worker dan queue.

---

## 🔄 Material Processing Flow

Ketika user mengupload materi:

```text
1. User upload file
          ↓
2. Express menerima request
          ↓
3. File divalidasi
          ↓
4. File information disimpan
          ↓
5. Job dimasukkan ke BullMQ
          ↓
6. Worker mengambil job
          ↓
7. Text extraction
          ↓
8. Material disimpan
          ↓
9. Generate Summary / Quiz
          ↓
10. AI memproses materi
          ↓
11. Hasil disimpan ke MongoDB
          ↓
12. Frontend mengambil hasil
```

---

## 🛡️ Validation & Error Handling

Backend melakukan validation terhadap request yang masuk untuk memastikan data yang diterima sesuai dengan kebutuhan API.

Validation digunakan untuk membantu mencegah data yang tidak sesuai masuk ke proses selanjutnya.

Selain itu, backend juga menangani error dari beberapa proses seperti:

* Authentication
* Database
* File upload
* Text extraction
* AI request
* Queue processing
* Validation

---

## 🎯 What I Learned

Project backend ini menjadi salah satu project yang saya gunakan untuk belajar lebih dalam tentang backend development.

Beberapa hal yang saya pelajari dan implementasikan:

* Membuat REST API menggunakan Express.js
* Authentication menggunakan JWT
* Password hashing menggunakan bcrypt
* MongoDB dan Mongoose
* File upload menggunakan Multer
* File processing
* Request validation
* Redis caching
* Queue menggunakan BullMQ
* Membuat dan menjalankan worker
* Background processing
* Asynchronous processing
* Integrasi AI menggunakan OpenRouter
* Membuat service untuk memisahkan logic
* Handling error
* Menghubungkan frontend dengan backend

Project ini juga membuat saya belajar bahwa backend bukan hanya tentang membuat endpoint, tetapi juga bagaimana menangani proses yang membutuhkan waktu, mengatur data, melakukan caching, menggunakan queue, dan mengintegrasikan layanan eksternal seperti AI.

---

## 🚧 Future Improvements

Beberapa hal yang masih ingin dikembangkan:

* [ ] Improve error handling
* [ ] Improve validation
* [ ] Improve Redis caching strategy
* [ ] Improve queue management
* [ ] Menambahkan retry mechanism yang lebih baik
* [ ] Menambahkan monitoring untuk worker
* [ ] Improve AI prompt
* [ ] Improve AI response validation
* [ ] Improve security
* [ ] Menambahkan logging yang lebih baik
* [ ] Improve file processing
* [ ] Menambahkan support untuk lebih banyak format file

---

## 📌 Status

**Development / Learning Project**

Backend StudyHub AI masih terus dikembangkan dan masih banyak bagian yang ingin saya improve.

Built with **Node.js + Express.js + MongoDB + Redis + BullMQ + AI** 🚀
