const express = require('express')
const router = express.Router()
const controllers = require('../controllers/controllers')
const authMiddleware = require('../middleware/auth')
const upload = require("../config/multer")
const aiRateLimiter = require("../middleware/rateLimiterRedis")
const { quizValidation, validate } = require("../middleware/validate");

router.post('/uploadFile', authMiddleware, upload.single('file'), controllers.postFile)
router.post('/:_id/extract', authMiddleware, controllers.postExtract)
router.post('/:_id/summary', authMiddleware,  aiRateLimiter, controllers.postSummary)
router.get("/summary/:id", authMiddleware, controllers.getSummary);
router.post('/:_id/quiz', authMiddleware, aiRateLimiter, controllers.postQuiz)
router.post("/:_id/quizAttempt", authMiddleware, quizValidation, validate, controllers.postCheckAnswer)

module.exports = router
