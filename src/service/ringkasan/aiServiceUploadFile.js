const callAI = require("../aiService");
const chunkText = require("../chunkService");

const systemPrompt = `
Buat ringkasan materi berikut.
Aturan:
- Ringkas menjadi poin-poin.
- Jangan menghilangkan konsep penting.
- Jangan menambah informasi baru.
`;

exports.generateSummary = async (text) => {
    console.log("TEXT MASUK:", typeof text);
    console.log(text);
    const chunks = chunkText(text, 5000);
    const summaries = [];
    for (const chunk of chunks) {
        const result = await callAI(systemPrompt, chunk);
        summaries.push(result);
    }
    return summaries.join("\n\n");
};