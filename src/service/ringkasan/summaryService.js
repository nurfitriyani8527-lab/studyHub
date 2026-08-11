const Material = require("../../model/material");
const Summary = require("../../model/summary");
const { getCached, saveCache } = require("../cacheService");
const { generateSummary } = require("./aiServiceUploadFile");

exports.createSummary = async (materialId) => {
    // cek material
    const material = await Material.findById(materialId);
    if (!material) {
        throw new Error("Material tidak ditemukan");
    }

    console.log(material.textContent)
    if (!material.textContent) {
        throw new Error("Material belum memiliki textContent");
    }

    const cacheKey = `summary:${material._id}`;

    // cek cache
    const cache = await getCached(cacheKey);
    if (cache && cache.status === "done") {
        return cache;
    }

    // cek database
    let summary = await Summary.findOne({
        material: material._id,
    });

    if (summary && summary.status === "done") {
        await saveCache(cacheKey, summary);
        return summary;
    }

    if (!summary) {
        summary = await Summary.create({
            material: material._id,
            status: "processing",
        });
    } else {
        summary.status = "processing";
        await summary.save();
    }

    try {
        const result = await generateSummary(material.textContent);
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