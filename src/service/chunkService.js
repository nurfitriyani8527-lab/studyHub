const chunkText = ((text, chunkSize = 3000) => {
    const paragraphs = text.split(/\n\s*\n/); // pisah berdasarkan paragraf kosong
    const chunks = [];
    let currentChunk = "";
    for (const paragraph of paragraphs) {
        // Kalau satu paragraf terlalu panjang
        if (paragraph.length > chunkSize) {
            // Simpan chunk sebelumnya dulu
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = "";
            }
            // Pecah paragraf besar berdasarkan akhir kalimat
            const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
            let sentenceChunk = "";
            for (const sentence of sentences) {
                if (
                    sentenceChunk.length + sentence.length <= chunkSize
                ) {
                    sentenceChunk += sentence + " ";
                } else {
                    chunks.push(sentenceChunk.trim());
                    sentenceChunk = sentence + " ";
                }
            }
            if (sentenceChunk) {
                chunks.push(sentenceChunk.trim());
            }
            continue;
        }
        // Kalau paragraf masih muat
        if (
            currentChunk.length + paragraph.length <= chunkSize
        ) {
            currentChunk += paragraph + "\n\n";
        } else {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph + "\n\n";
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }
    return chunks
})

module.exports = chunkText