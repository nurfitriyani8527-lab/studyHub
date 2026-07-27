const express = require('express')
const router = express.Router()
const authControllers = require('../controllers/authControllers')
const { loginValidation, validate } = require("../middleware/validate");

router.post('/register',authControllers.postRegister)

// router.post("/register", adminController.postRegister)
router.post("/login", loginValidation, validate, authControllers.postLogin)

module.exports = router