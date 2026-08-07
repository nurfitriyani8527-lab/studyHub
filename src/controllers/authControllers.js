require('dotenv').config()
const User = require('../model/user')
const jwt = require('jsonwebtoken')
const respon = require('../utils/response')
const bcrypt = require("bcrypt")

exports.postRegister = async (req,res) => {
    try {
        const { name, email, password } = req.body
        if(!name || !email || !password){
            return respon(res,401,false,"data tidak boleh kosong")
        }
        const duplikat = await User.findOne({email})
            if(duplikat){
                return respon(res,400,false,"Email sudah terdaftar")
            }

        const saveLogin = await User.create({
            name,
            email,
            password
        });

        respon(res, 201, true, "Berhasil membuat akun", {
            user: {
                id: saveLogin._id,
                name: saveLogin.name,
                email: saveLogin.email
            }
        });
    } catch (error){
        return respon(res, 500, false, "Server error", error.message)
    }
}

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Cari user
        const user = await User.findOne({ email });
        
        // Jika user tidak ada
        if (!user) {
            return respon(res, 401, false, "Email atau password salah");
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return respon(res, 401, false, "Email atau password salah");
        }

        // Buat JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return respon(res, 200, true, "Login berhasil", { token });
    } catch (error) {
        return respon(res, 500, false, "Server error", error.message);
    }
};
