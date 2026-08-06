const mongoose = require('mongoose')

const quizAttemptSchema = new mongoose.Schema({
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz", 
        required: true 
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true 
    },
    answers: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
            },      
            selectedAnswer: {
                type: String,
                required: true,
                isIt: {
                    options: [["A", "B", "C", "D"]],
                    errorMessage: "Jawaban hanya boleh A, B, C, atau D"
                }
            },
            isCorrect: {
                type: Boolean,
                required: true
            }
        }
    ],
    score: {
        type: Number,
        required: true
    },
    correctCount: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    }
}, { timestamps: true }
);
quizAttemptSchema.index({ quiz: 1, user: 1 });
module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);