const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    status: "A.T.L.A.S ONLINE",
    message: "Jarvis AI system running.",
  });
});

app.post("/atlas-ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é A.T.L.A.S, uma inteligência artificial avançada estilo Jarvis criada por Daniel Moreira.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      success: true,
      response: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`A.T.L.A.S rodando na porta ${PORT}`);
});
