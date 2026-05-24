const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>A.T.L.A.S</title>
        <style>
          body {
            background: #0b1020;
            color: #00ffd5;
            font-family: Arial;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }

          .panel {
            text-align: center;
            padding: 40px;
            border: 2px solid #00ffd5;
            border-radius: 20px;
            box-shadow: 0 0 30px #00ffd5;
            background: #11182d;
          }

          h1 {
            font-size: 50px;
            margin-bottom: 10px;
          }

          p {
            font-size: 20px;
            color: white;
          }

          .status {
            margin-top: 20px;
            color: lime;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <div class="panel">
          <h1>A.T.L.A.S</h1>
          <p>Advanced Tactical Logistic Artificial System</p>

          <div class="status">
            ● CENTRAL INTELLIGENCE ONLINE
          </div>
        </div>
      </body>
    </html>
  `);
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
