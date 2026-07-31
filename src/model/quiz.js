const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material", 
        required: true 
    },
    questions: [
        {
            question: String,
            options: {
                type: [String],
                validate: {
                    validator: (arr) => arr.length === 4,
                    message: "Options harus berisi tepat 4 pilihan."
                }
            },
            correctAnswer: {
                type: "string",
                enum: ["A","B","C","D"]
            },
            explanation: String
        }
    ],
    status: {
        type: String,
        enum: ['processing', 'done', 'failed'],
        default: 'processing'
    },
}, { timestamps: true }
);
module.exports = mongoose.model('Quiz',quizSchema.index({
    material : 1,
    }))