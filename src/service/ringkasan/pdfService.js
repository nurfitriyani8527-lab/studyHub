const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");

// untuk pdf
exports.extractTextFromPdf = async (filePath) => {
    try {
        const dataBuffer = await fs.readFile(filePath);

        const parser = new PDFParse({
            data: dataBuffer
        });

        const result = await parser.getText();

        await parser.destroy(); // opsional, tapi direkomendasikan

        return result.text;
    } catch (error) {
        console.error(error);
        throw error;
    }
};