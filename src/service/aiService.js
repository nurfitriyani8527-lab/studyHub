require('dotenv').config()
const axios = require('axios')

const callAI = async (systemPrompt, userPrompt, responseFormat = null) => {
    try {
        const payload = {
            model: process.env.OPENROUTER_MODEL,
            temperature: 0,
            max_tokens: 2000,

            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        };

        if (responseFormat) {
            payload.response_format = responseFormat;
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data.choices[0].message.content
    } catch (error) {
        console.error(error.response?.data || error.message)
        throw error
    }
}

module.exports = callAI