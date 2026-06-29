const Together = require("together-ai");
const config = require("../config");

const together = new Together({
    apiKey: config.TOGETHER_API_KEY
});

async function askAI(prompt) {

    const response = await together.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    });

    return response.choices[0].message.content;
}

module.exports = {
    askAI
};
