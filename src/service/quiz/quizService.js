const Material = require("../../model/material");
const Quiz = require("../../model/quiz")
const { getCached, saveCache } = require("../cacheService");
const { generateQuiz } = require("./aiServiceQuiz")
const { cleanAiJsonResponse } = require("./cleanAiJsonResponse")

exports.createQuiz = async (materialId) => {
    // cari material
    const material = await Material.findById(materialId);  
    if (!material) {
        throw new Error("Material tidak ditemukan");
    }
    const cacheKey = `quiz:${material._id}`;
    // cek cache
    const cache = await getCached(cacheKey);
    if (cache) {
        return cache;
    }

    // cek quiz di database
    const existingQuiz = await Quiz.findOne({
            material: material._id,
        });
        if (existingQuiz) {
            await saveCache(cacheKey, existingQuiz);
            return existingQuiz;
        }

    // buat quiz status processing
    const quiz = await Quiz.create({
        material: material._id,
        status: "processing",
    });

    try {
        // chunk text dan callAI ini juga udah di gabung,di clean, dan di parse
        const result = await generateQuiz(
            material.textContent
        )

        // 11. status = done
        quiz.questions = result
        quiz.status = "done"
        
        await quiz.save();
        await saveCache(cacheKey, quiz);

        return quiz
        // 14. response
    } catch (error) {
        console.error(error);
        quiz.status = "failed";
        await quiz.save();
        throw error;
    }
}