const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema({
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File", 
        required: true 
    },
    textContent: {
        type: String
    },
    status: {
        type: String,
        enum: ['processing', 'done', 'failed'],
        default: 'processing'
    },
}, { timestamps: true }
);
module.exports = mongoose.model('Material',materialSchema)