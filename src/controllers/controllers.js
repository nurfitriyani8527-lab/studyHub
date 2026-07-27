const File = require('../model/uploadFile')
const Material = require("../model/material")
const Summary = require("../model/summary")
const Quiz = require("../model/quiz")
const QuizAttempt = require("../model/quizAttempt")
const jwt = require('jsonwebtoken')
const respon = require('../utils/response')
const path = require('path')
const fs = require('fs')
const { extractTextFromPdf } = require("../service/ringkasan/pdfService")
const { redis } = require("../config/redis")
const { createSummary } = require("../service/ringkasan/summaryService");
// const callAI = require("../service/aiService")
// const { cleanAiJsonResponse } = require("../service/quiz/cleanAiJsonResponse")
// const chunkText = require("../service/chunkService")
const { createQuiz } = require('../service/quiz/quizService')

exports.postFile = async (req,res) => {
    try {
        if(!req.file){
            return respon(res,400,false,"tidak ada file yang dipilih",req.file)
        }
        // ambil data dari req.file
        const { originalname,filename,size,mimetype } = req.file

        // ambil data user
        const user = req.user;
        if (!user) {
            return respon(res, 404, false, "User tidak ditemukan", null);
        }

        // translate mime to filetype
        const mimeToFileType = {
            "application/pdf": "pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        };

        const fileType = mimeToFileType[mimetype] || "UNKNOWN";
        console.log(fileType);

        // simpan ke db
        const file = await File.create({
            user: user.id,
            originalName : originalname,
            fileName : filename,
            fileSize: size,
            fileType
        });
        respon(res,201,true,"file berhasil di upload",file) // respon kalau berhasil
    } catch (error) {
        respon(res,500,false,"ada kesalahan saat memasukan file",error.message) // respon kalau salah
    }
}

exports.postExtract = async (req,res) => {
    let material
    try {
        const _id = req.params._id
        const file = await File.findById(_id)
        if(!file){
            return respon(res,404,false,"File tidak ditemukan",null)
        }
        material = await Material.create({
            status: "processing",
            file: file._id
        });
        
        const filePath = path.resolve("./uploads", file.fileName);
        const text = await extractTextFromPdf(filePath)
        console.log("TEXT:", text);

        material.textContent = text
        material.status = "done"
        await material.save()
        respon(res,200,true,"upload file berhasil",material)
    } catch (error) {
        if (material) {
            material.status = "failed";
            await material.save();
        }
        return respon(res, 500, false, "Ada kesalahan saat mengupload file", error.message);
    }
}

exports.postSummary = async (req, res) => {
    try {
        const summary = await createSummary(req.params._id);

        return respon(res,200,true,"Summary berhasil dibuat",summary);
    } catch (err) {
        return respon(res,500,false,"ada kesalahan saat summary",err.message);
    }
};

// ini untuk dijadiin riwayat di frontend
exports.getSummary = async (req, res) => {
    try {
        const { id } = req.params;
        const key = `summary:${id}`;

        // 1. Cek Redis
        const cache = await redis.get(key);

        if (cache) {
            console.log("Cache HIT");
            return respon(res,200,true,JSON.parse(cache));
        }
        console.log("Cache MISS");

        // 2. Ambil dari MongoDB
        const summary = await Summary.findById(id).lean();
        if (!summary) {
            return respon(res,404,false,"Summary tidak ditemukan",null);
        }

        // 3. Simpan ke Redis selama 5 menit
        await redis.set(
            key,
            JSON.stringify(summary),
            {
                ex: 300
            }
        );
        return respon(res,200,true,"Data dari database",summary);
    } catch (error) {
        console.error(error);
        return respon(res,500,false,"Terjadi kesalahan server",null);
    }
};

exports.postQuiz = async (req,res) => {
    try {
        const quiz = await createQuiz(req.params._id);
        // console.log(quiz)
        return respon(res,200,true,"Quiz berhasil dibuat",quiz);
    } catch (err) {
        return respon(res,500,false,"ada kesalahan saat membuat quiz",err.message);
    }
}


exports.postCheckAnswer = async (req, res) => {
    try {
        const _id = req.params._id
        const quiz = await Quiz.findById(_id)
        if (!quiz) {
            return respon(res, 404, false, "Quiz tidak ditemukan", null)
        }

        const { answers } = req.body
        if (answers.length !== quiz.questions.length) {
            return respon(res,400,false,"Jumlah jawaban tidak sesuai dengan jumlah soal",null);
        }

        const userId = req.user.id
        if (!userId) {
            return respon(res, 404, false, "User tidak ditemukan", null);
        }
        let correctCount = 0
        const detailedAnswers = []

        answers.forEach((answer) => {
            const question = quiz.questions.find(
                (q) => q._id.toString() === answer.questionId
            )
            if (!question){
                respon(res,404,false,"jawaban belum ada",question)
            } 

            const isCorrect = question.correctAnswer === answer.selectedAnswer
            if (isCorrect) {
                correctCount++
            }

            detailedAnswers.push({
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect
            })
        })

        const totalQuestions = quiz.questions.length
        const score = (correctCount / totalQuestions) * 100 // rumus persentase, kamu udah tau dari sebelumnya

        // simpan ke QuizAttempt
        const attempt = await QuizAttempt.create({
            quiz: quiz._id,
            user: userId,
            answer: detailedAnswers,
            score,
            correctCount,
            totalQuestions
              // isi semua field sesuai schema yang ka
            // mu bikin
        })
        respon(res, 200, true, "Koreksi berhasil", attempt)
    } catch (error) {
        return respon(res, 500, false, "Ada kesalahan saat koreksi jawaban", error.message)
    }
}