const { body, validationResult } = require("express-validator");

const loginValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("email wajib diisi")
        .isEmail()
        .withMessage("email tidak valid"),

    body("password")
        .trim()
        .notEmpty()
        .withMessage("password wajib diisi")
        .isLength({min: 8})
]

const quizValidation = [
    body("answers")
        .isArray({ min: 1 })
        .withMessage("answers harus berupa array dan tidak boleh kosong"),
]

const validate = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            success: false,
            errors: errors.array()
        });

    }

    next();

};

module.exports = {
    quizValidation,
    loginValidation,
    validate
};