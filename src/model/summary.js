const mongoose = require('mongoose')

const summarySchema = new mongoose.Schema({
    material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material", 
        required: true 
    },
    summaryContent: {
        type: String
    },
    status: {
        type: String,
        enum: ['processing', 'done', 'failed'],
        default: 'processing'
    },
}, { timestamps: true }
);
module.exports = mongoose.model('Summary',summarySchema.index({
    material : 1,
    }))