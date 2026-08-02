require("dotenv").config();

const { Worker } = require("bullmq");
const path = require("path");

const connection = require("../config/redisQueue");

const Material = require("../models/material");
const { extractTextFromPdf } = require("../services/extractService");
const { createQuiz } = require("../service/quiz/quizService")
const { createSummary } = require("../service/ringkasan/summaryService")

const worker = new Worker(
    "upload-material",
    async (job) => {

        const { materialId } = job.data;

        const material = await Material.findById(materialId);

        if (!material) {
            throw new Error("Material tidak ditemukan");
        }

        console.log("Generate Summary...");
        await createSummary(material._id);

        console.log("Generate Quiz...");
        await createQuiz(material._id);

        material.status = "done";
        await material.save();

        console.log("Semua proses selesai");
    },
    {
        connection
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} selesai`);
});

worker.on("failed", async (job, err) => {

    console.error(err);

    const material = await Material.findById(job.data.materialId);

    if (material) {
        material.status = "failed";
        await material.save();
    }

    material.status = "done";
    await material.save();
});