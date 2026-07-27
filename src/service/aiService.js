require('dotenv').config()
const axios = require('axios')

const callAI = async (systemPrompt, userPrompt) => {
    try {
        const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-oss-20b:free",
            temperature: 0,
            max_tokens: 2000,

            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],

            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "quiz",
                    strict: true,
                    schema: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                question: {
                                    type: "string"
                                },
                                options: {
                                    type: "array",
                                    items: {
                                        type: "string"
                                    },
                                    minItems: 4,
                                    maxItems: 4
                                },
                                correctAnswer: {
                                    type: "string",
                                    enum: ["A", "B", "C", "D"]
                                },
                                explanation: {
                                    type: "string"
                                }
                            },
                            required: [
                                "question",
                                "options",
                                "correctAnswer",
                                "explanation"
                            ],
                            additionalProperties: false
                        }
                    }
                }
            }
        },
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