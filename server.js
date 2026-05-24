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
        body{
          background:#0b1020;
          color:#00ffd5;
          font-family:Arial;
          margin:0;
          height:100vh;
          display:flex;
          justify-content:center;
          align-items:center;
        }

        .container{
          width:700px;
          background:#11182d;
          border:2px solid #00ffd5;
          border-radius:25px;
          padding:30px;
          box-shadow:0 0 40px #00ffd5;
        }

        h1{
          text-align:center;
          font-size:50px;
          margin-bottom:10px;
        }

        .subtitle{
          text-align:center;
          color:white;
          margin-bottom:25px;
        }

        #chat{
          height:300px;
          overflow-y:auto;
          background:#0d1425;
          border-radius:15px;
          padding:15px;
          margin-bottom:20px;
          color:white;
        }

        .message{
          margin-bottom:15px;
        }

        .user{
          color:#00ffd5;
        }

        .atlas{
          color:#ffffff;
        }

        .input-area{
          display:flex;
          gap:10px;
        }

        input{
          flex:1;
          padding:15px;
          border:none;
          border-radius:12px;
          background:#0d1425;
          color:white;
          font-size:16px;
        }

        button{
          padding:15px 25px;
          border:none;
          border-radius:12px;
          background:#00ffd5;
          color:black;
          font-weight:bold;
          cursor:pointer;
        }

        button:hover{
          opacity:0.8;
        }
      </style>
    </head>

    <body>

      <div class="container">

        <h1>A.T.L.A.S</h1>

        <div class="subtitle">
          Advanced Tactical Logistic Artificial System
        </div>

        <div id="chat">
          <div class="message atlas">
            ⚡ A.T.L.A.S CENTRAL INTELLIGENCE ONLINE
          </div>
        </div>

        <div class="input-area">
          <input
            type="text"
            id="prompt"
            placeholder="Digite um comando..."
          />

          <button onclick="sendMessage()">
            SEND
          </button>
        </div>

      </div>

      <script>

        async function sendMessage(){

          const input = document.getElementById("prompt");

          const chat = document.getElementById("chat");

          const prompt = input.value;

          if(!prompt) return;

          chat.innerHTML +=
          '<div class="message user">🧑 Você: ' + prompt + '</div>';

          input.value = "";

          const response = await fetch("/atlas-ai",{
            method:"POST",
            headers:{
              "Content-Type":"application/json"
            },
            body:JSON.stringify({
              prompt:prompt
            })
          });

          const data = await response.json();

          chat.innerHTML +=
          '<div class="message atlas">🤖 A.T.L.A.S: ' + data.response + '</div>';

          chat.scrollTop = chat.scrollHeight;
        }

      </script>

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
