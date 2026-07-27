exports.cleanAiJsonResponse = (rawText) => {
    // Menghapus ```json (atau sekadar ```) di awal teks dan menghapus ``` di akhir teks.
    // Bendera 'i' membuatnya case-insensitive (bisa ```JSON atau ```json)
    let cleaned = rawText.replace(/^```(?:json)?/i, '');
    cleaned = cleaned.replace(/```$/i, '');
    
    // Membuang spasi atau newline (enter) berlebih di awal dan akhir teks
    cleaned = cleaned.trim();
    return cleaned
}