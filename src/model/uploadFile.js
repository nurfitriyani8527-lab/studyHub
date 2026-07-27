const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true 
    },
    originalName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'done', 'failed'],
        default: 'processing'
    },
    fileType: {
        type: String,
        enum: ['pdf', 'docx'],
        required: true
    },
}, { timestamps: true }
);
module.exports = mongoose.model('File',fileSchema)