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
const { getCached, saveCache } = require("../service/cacheService")
const { createSummary } = require("../service/ringkasan/summaryService");
// const callAI = require("../service/aiService")
// const { cleanAiJsonResponse } = require("../service/quiz/cleanAiJsonResponse")
// const chunkText = require("../service/chunkService")
const { createQuiz } = require('../service/quiz/quizService')
const uploadQueue = require("../queue/uploadQueue")
const { tryCatch } = require('bullmq')

exports.postFile = async (req, res) => {
    try {
        if (!req.file) {
            return respon(res, 400, false, "tidak ada file yang dipilih", req.file)
        }
        // ambil data dari req.file
        const { originalname, filename, size, mimetype } = req.file

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
            originalName: originalname,
            fileName: filename,
            fileSize: size,
            fileType
        });
        respon(res, 201, true, "file berhasil di upload", file) // respon kalau berhasil
    } catch (error) {
        return respon(res, 500, false, "ada kesalahan saat memasukan file", error.message) // respon kalau salah
    }
}

exports.postExtract = async (req, res) => {
    let material
    try {
        const _id = req.params._id

        const file = await File.findById(_id)
        if (!file) {
            return respon(res, 404, false, "File tidak ditemukan", null)
        }
        material = await Material.create({
            status: "processing",
            file: file._id
        });

        await uploadQueue.add(
            "upload-material",
            {
                materialId: material._id.toString(),
                fileName: file.fileName,
            },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            }
        );

        respon(res, 200, true, "extract file berhasil", material)
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
        console.log(summary)

        return respon(res, 200, true, "Summary berhasil dibuat", summary);
    } catch (err) {
        return respon(res, 500, false, "ada kesalahan saat summary", err.message);
        console.log(err)
    }
};

exports.getSummary = async (req, res) => {
    try {
        const materialId = req.params.id
        if (!materialId) {
            return respon(res, 400, false, "Material tidak ditemukan", materialId)
        }
        const key = `summary:${materialId}`;

        // 1. Cek Redis
        const cache = await getCached(key);

        if (cache) {
            console.log("Cache HIT");
            return respon(res, 200, true, "Data dari cache", cache);
        }
        console.log("Cache MISS");

        // 2. Ambil dari MongoDB
        const summary = await Summary.findOne({
            material: materialId
        }).lean();

        if (!summary) {
            return respon(res, 404, false, "Summary tidak ditemukan", summary);
        }

        // 3. Simpan ke Redis selama status 'done'
        if (summary.status === 'done') {
            await saveCache(key, summary);
        }
        return respon(res, 200, true, "Data dari database", summary);
    } catch (error) {
        console.error("Error getSummary:", error);
        return respon(res, 500, false, "Terjadi kesalahan server", error.message);
    }
};

exports.postQuiz = async (req, res) => {
    try {
        const quiz = await createQuiz(req.params._id);

        return respon(res, 200, true, "Quiz berhasil dibuat", quiz);
    } catch (err) {
        return respon(res, 500, false, "ada kesalahan saat membuat quiz", err.message);
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
            return respon(res, 400, false, "Jumlah jawaban tidak sesuai dengan jumlah soal", null);
        }

        const userId = req.user.id
        if (!userId) {
            return respon(res, 404, false, "User tidak ditemukan", null);
        }
        let correctCount = 0
        const detailedAnswers = []

        for (const answer of answers) {
            const question = quiz.questions.find(
                (q) => q._id.toString() === answer.questionId
            );
            if (!question) {
                return respon(res, 404, false, "Soal tidak ditemukan untuk ID yang diberikan", null);
            }

            const isCorrect = question.correctAnswer === answer.selectedAnswer;
            if (isCorrect) {
                correctCount++;
            }

            detailedAnswers.push({
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect
            });
        }

        const totalQuestions = quiz.questions.length
        const score = Math.round((correctCount / totalQuestions) * 100) // dibulatkan

        // simpan ke QuizAttempt
        const attempt = await QuizAttempt.create({
            quiz: quiz._id,
            user: userId,
            answers: detailedAnswers,
            score,
            correctCount,
            totalQuestions
        });
        respon(res, 200, true, "Koreksi berhasil", attempt)
    } catch (error) {
        return respon(res, 500, false, "Ada kesalahan saat koreksi jawaban", error.message)
    }
}

exports.getRiwayatAnswer = async (req,res) => {
    try {
        const quizAttemptId = req.params.id;
        const userId = req.user.id;

        if (!quizAttemptId) {
            return respon(res,400,false,"Quiz attempt tidak ditemukan",null);
        }

        const key = `quiz-attempt:${userId}:${quizAttemptId}`;

        // 1. Cek Redis
        const cache = await getCached(key);

        if (cache) {
            console.log("🔥 Quiz Attempt Cache HIT");
            return respon(res,200,true,"Data dari cache",cache);
        }

        console.log("🔥 Quiz Attempt Cache MISS");

        // 2. Cari attempt milik user yang sedang login
        const quizAttempt = await QuizAttempt.findOne({
            _id: quizAttemptId,
            user: userId
        }).lean();

        if (!quizAttempt) {
            return respon(res,404,false,"Riwayat quiz tidak ditemukan",null);
        }

        // 3. Data yang memang dibutuhkan frontend
        const result = {
            score: quizAttempt.score,
            correctCount: quizAttempt.correctCount,
            totalQuestions: quizAttempt.totalQuestions
        };

        // 4. Simpan cache
        await saveCache(key, result);

        return respon(res,200,true,"Riwayat quiz berhasil diambil",result);

    } catch (error) {
        console.error("Error getRiwayatAnswer:", error);
        return respon(res,500,false,"Terjadi kesalahan server",error.message);
    }
}

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id
        // hitung total file milik user (dokumen ter upload)
        const totalFiles = await File.countDocuments({ user: userId })

        // mencari quizAttempt dari user (rata2 quiz)
        const quizAttempt = await QuizAttempt.find({ user: userId })
        // ambil nilai yang cuman ada di score
        const score = quizAttempt.map((item) => item.score)
        // menjumlahkan semua score
        const total = score.reduce((acc, curr) => acc + curr, 0)
        // di rata2 in pakai ternary
        const average = quizAttempt.length ? total / quizAttempt.length : 0
        console.log("nilai rata2 : ", average)

        // ambil semua file milik user lagi (query berjenjang karena model summary and quiz gak ada usernya)
        const files = await File.find({ user: userId })
        const fileIds = files.map((file) => file._id)
        // Ambil semua Material yang file-nya ada di dalam fileIds
        const materials = await Material.find({ file: { $in: fileIds } })
        const materialIds = materials.map((material) => material._id)

        // total summary (ringkasan yang dibuat)
        const totalSummaries = await Summary.countDocuments({
            material: { $in: materialIds },
            status: 'done'
        })
        console.log("Total Summary : ", totalSummaries)

        // total quiz (quiz dikerjakan)
        const totalQuizzes = await quizAttempt.length
        console.log("Total Summary : ", totalQuizzes)

        respon(res, 200, true, "Dashboard berhasil diambil", {
            totalFiles,
            totalSummaries,
            totalQuizzes,
            averageScore: Math.round(average)  // dibulatin
        })
    } catch (error) {
        return respon(res, 500, false, "Ada kesalahan saat mengambil dashboard", error.message)
    }
}

exports.getRecentActivity = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const userId = req.user.id;

        const files = await File.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const activities = await Promise.all(
            files.map(async (file) => {
                const material = await Material.findOne({
                    file: file._id
                });

                let badge = "Diproses";
                let summary = null;
                let quizAttempt = null;

                if (material) {
                    const quiz = await Quiz.findOne({
                        material: material._id,
                        status: "done"
                    });

                    summary = await Summary.findOne({
                        material: material._id,
                        status: "done"
                    });

                    if (quiz) {
                        quizAttempt = await QuizAttempt.findOne({
                            quiz: quiz._id,
                            user: userId
                        })
                        .sort({ createdAt: -1 })
                        .lean();
                    }

                    if (quiz) {
                        badge = "Kuis Siap";
                    } else if (summary) {
                        badge = "Ringkasan Siap";
                    }
                }

                return {
                    fileId: file._id,
                    materialId: material?._id,
                    summaryId: summary?._id,
                    quizAttemptId: quizAttempt?._id,
                    name: file.originalName,
                    type: file.fileType,
                    status: badge,
                    createdAt: file.createdAt
                };
            })
        );

        return respon(
            res,
            200,
            true,
            "Aktivitas terbaru berhasil diambil",
            activities
        );

    } catch (error) {
        console.error("❌ ERROR getRecentActivity:", error);
        console.error("❌ MESSAGE:", error.message);
        console.error("❌ STACK:", error.stack);

        return respon(
            res,
            500,
            false,
            "Ada kesalahan saat mengambil aktivitas",
            error.message
        );
    }
};
