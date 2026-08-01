const multer = require("multer");
const respon = require("../utils/response")

const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
    //     return res.status(400).json({
    //         success: false,
    //         name: err.name,
    //         code: err.code,
    //         message: err.message,
    //         stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
    // });
        switch (err.code) {
                case "LIMIT_FILE_SIZE":
                    err.message = "Ukuran file maksimal 10 MB";
                    break;

                case "LIMIT_UNEXPECTED_FILE":
                    err.message = "Nama field upload tidak sesuai";
                    break;

                case "LIMIT_PART_COUNT":
                    err.message = "Terlalu banyak bagian pada form";
                    break;

                default:
                    err.message = "Terjadi kesalahan saat upload file";
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });

    } else if (err.message === "Format file tidak didukung. Gunakan PDF atau DOCX") {
        return res.status(400).json({
            success: false,
            message: err.message
        });

    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = uploadErrorHandler;