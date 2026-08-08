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

    if (!material.textContent) {
        throw new Error("Material belum memiliki textContent");
    }

    const cacheKey = `quiz:${material._id}`;
    // cek cache
    const cache = await getCached(cacheKey);
    if (cache && cache.status === "done") {
        return cache;
    }

    // cek quiz di database
    let quiz = await Quiz.findOne({
        material: material._id,
    });
    if (quiz && quiz.status === "done") {
        await saveCache(cacheKey, quiz);
        return quiz;
    }

    if (!quiz) {
        quiz = await Quiz.create({
            material: material._id,
            status: "processing",
        });
    } else {
        quiz.status = "processing";
        await quiz.save();
    }

    try {
        const result = await generateQuiz(material.textContent);

        quiz.questions = result;
        quiz.status = "done";
        
        await quiz.save();
        await saveCache(cacheKey, quiz);

        return quiz;
    } catch (error) {
        console.error(error);
        quiz.status = "failed";
        await quiz.save();
        throw error;
    }
};