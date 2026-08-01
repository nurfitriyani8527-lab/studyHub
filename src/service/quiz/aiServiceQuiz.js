const callAI = require("../aiService");
const chunkText = require("../chunkService");
const { cleanAiJsonResponse } = require("./cleanAiJsonResponse")

const systemPrompt = `
    Kamu adalah ai yang akan bikin soal pilihan ganda, kamu bakal di kasih teks materi buat di proses.
    Buatkan maksimal 1 soal pilihan ganda berdasarkan materi yang diberikan.
    Setiap soal harus punya: 
    - pertanyaan
    - 4 pilihan jawaban (A, B, C, D)
    - jawaban yang benar
    - (explanation) penjelasan singkat kenapa itu jawaban benar
    ATURAN OUTPUT (paling penting):
    - Jawab HANYA dengan JSON array yang valid, tanpa teks pembuka atau penutup apapun
    - JANGAN bungkus jawaban dengan markdown code block
    - Semua key harus pakai tanda kutip ganda sesuai standar JSON
    - jangan ada emote, pokoknya jangan ada yang melenceng dari perintah!!
    - JANGAN membuat lebih dari 4 options.
    - Pakai bahasa sesuai PDF/DOCX yang diupload yaaa!
    Contoh format output:
    [
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "B", "explanation": "..." },
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "B", "explanation": "..." },
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "B", "explanation": "..." },
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "B", "explanation": "..." },
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctAnswer": "B", "explanation": "..." }
    pokoknya jangan ada yang melenceng dari perintah!!
    ]`;

exports.generateQuiz = async (text) => {
    const chunks = chunkText(text, 3000);
    const questions = [];

    for (let i = 0; i < chunks.length; i++) {
        try {
            console.log(`===== Chunk ${i + 1}/${chunks.length} =====`);

            const ai = await callAI(systemPrompt, chunks[i]);

            const clean = cleanAiJsonResponse(ai);
            if (!clean.startsWith("[")) {
                console.log(clean);
                throw new Error("AI tidak mengembalikan JSON.");
            }

            const parsed = JSON.parse(clean);

            questions.push(...parsed);

            console.log(`Chunk ${i + 1} berhasil`);
        } catch (err) {
            console.error(`Chunk ${i + 1} gagal`);
            console.error(err);

            // jangan hentikan proses
            continue;
        }
    }

    if (questions.length === 0) {
        throw new Error("Semua chunk gagal diproses.");
    }

    return questions.slice(0, 10);
};