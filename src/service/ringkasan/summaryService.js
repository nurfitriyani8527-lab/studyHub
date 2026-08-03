const Material = require("../../model/material");
const Summary = require("../../model/summary");
const { getCached, saveCache } = require("../cacheService");
const { generateSummary } = require("./aiServiceUploadFile");

exports.createSummary = async (materialId) => {
    // cek material
    const material = await Material.findById(materialId);
    console.log("===== MATERIAL =====");
    console.log(material);
    console.log("====================");
    if (!material) {
        throw new Error("Material tidak ditemukan");
    }
    const cacheKey = `summary:${material._id}`;

    // cek cache
    const cache = await getCached(cacheKey);
    if (cache) {
        return cache;
    }

    // cek database
    const existingSummary = await Summary.findOne({
        material: material._id,
    });
    if (existingSummary) {
        await saveCache(cacheKey, existingSummary);
        return existingSummary;
    }

    // buat processing
    const summary = await Summary.create({
        material: material._id,
        status: "processing",
    });
    try {
        console.log("TEXT CONTENT:");
        console.log(material.textContent);
        console.log(typeof material.textContent);
        const result = await generateSummary(
            material.textContent
        );
        summary.summaryContent = result;
        summary.status = "done";

        await summary.save();
        await saveCache(cacheKey, summary);

        return summary;
    } catch (err) {
        summary.status = "failed";
        await summary.save();
        throw err;
    }
};