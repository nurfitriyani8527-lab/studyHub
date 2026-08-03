const mammoth = require("mammoth");

// untuk docx
exports.extractTextFromDocx = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({
            path: filePath
        });

        return result.value;
    } catch (error) {
        console.error(error);
        throw error;
    }
};