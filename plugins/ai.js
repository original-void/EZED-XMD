const config = require("../config");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY
});
