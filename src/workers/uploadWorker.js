require("dotenv").config();

const { Worker } = require("bullmq");
const path = require("path");

const connection = require("../config/redisQueue");

const Material = require("../model/material");
const { extractTextFromPdf } = require("../service/ringkasan/pdfService");
const { createQuiz } = require("../service/quiz/quizService")
const { createSummary } = require("../service/ringkasan/summaryService")
const { connectDB } = require("../config/database")
const { extractTextFromDocx } = require("../service/ringkasan/docxService")
const File = require("../model/uploadFile")

connectDB()

const worker = new Worker(
    "upload-material",
    async (job) => {

        const { materialId, fileName } = job.data;

        const material = await Material.findById(materialId);

        if (!material) {
            throw new Error("Material tidak ditemukan");
        }

        console.log("Generate Extract...");
        
        const filePath = path.join(
            __dirname,
            "../../uploads",
            fileName
        );

        const file = await File.findById(material.file);

        let text;

        if (file.fileType === "pdf") {
            text = await extractTextFromPdf(filePath);
        } else if (file.fileType === "docx") {
            text = await extractTextFromDocx(filePath);
        } else {
            throw new Error("Format file tidak didukung");
        }
        console.log("HASIL EXTRACT:", text?.slice(0,100));
        console.log(text);

        material.textContent = text;
        await material.save();

        console.log("SETELAH SAVE:");
        console.log(material.textContent?.slice(0,100));

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
});