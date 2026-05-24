const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());

app.use(express.json());
app.post("/atlas-login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ATLAS_PASSWORD) {
    return res.json({
      success: true,
      message: "A.T.L.A.S access granted."
    });
  }

  return res.status(401).json({
    success: false,
    message: "Access denied."
  });
});

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const atlasMemory = JSON.parse(
  fs.readFileSync("./atlas-memory.json", "utf8")
);
let conversationMemory = [];

try {
  conversationMemory = JSON.parse(
    fs.readFileSync("./atlas-conversation-memory.json", "utf8")
  );
} catch {
  conversationMemory = [];
}
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
    <div id="loginScreen" style="
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
background:#0b1020;
display:flex;
justify-content:center;
align-items:center;
z-index:9999;
flex-direction:column;
">

<h1 style="color:#00ffd5;font-size:50px;">
A.T.L.A.S ACCESS
</h1>

<input
id="atlasPassword"
type="password"
placeholder="Enter password..."
style="
padding:15px;
width:300px;
border-radius:10px;
border:none;
margin-top:20px;
font-size:18px;
"
/>

<button
onclick="loginAtlas()"
style="
margin-top:20px;
padding:15px 30px;
border:none;
border-radius:10px;
background:#00ffd5;
font-size:18px;
cursor:pointer;
">
ACCESS
</button>

<p id="loginError" style="color:red;margin-top:15px;"></p>

</div>

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
      async function loginAtlas() {

const password =
document.getElementById("atlasPassword").value;

const response = await fetch("/atlas-login", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
password
})
});

if (response.ok) {

document.getElementById("loginScreen")
.style.display = "none";

} else {

document.getElementById("loginError")
.innerText = "ACCESS DENIED";

}

}

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
'<div class="message atlas">🤖 A.T.L.A.S: ' + (data.response || data.error || "AI Core aguardando créditos da OpenAI API.") + '</div>';
          chat.scrollTop = chat.scrollHeight;
        }
document.getElementById("prompt").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});
      </script>

    </body>
  </html>
  `);
});

app.post("/atlas-ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    const recentMemory = conversationMemory.slice(-20);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
Você é A.T.L.A.S — Advanced Tactical Life & Automation System.

Sistema operacional inteligente avançado criado por Daniel Moreira de Souza Junior.

MEMÓRIA CENTRAL:
${JSON.stringify(atlasMemory, null, 2)}

Use essas informações como memória persistente principal do sistema.

Você deve agir como:
- estrategista
- mentor
- operador
- analista
- assistente pessoal
- sistema operacional inteligente

Seu objetivo é servir Daniel Moreira da forma mais eficiente, estratégica, inteligente e útil possível em todas as áreas da vida.

Responda sempre em português brasileiro.
Priorize clareza, execução, estratégia, automação e alta performance.

REGRAS DE COMUNICAÇÃO:
- Chame Daniel de "senhor" por padrão.
- Não chame Daniel de "Daniel" em toda resposta.
- Use "senhor" de forma natural, como um assistente estilo Jarvis.
- Daniel Moreira de Souza Junior é o criador e usuário principal do A.T.L.A.S.
- Responda de forma curta, direta e objetiva por padrão.
- Só responda longo quando o senhor pedir detalhes.
- Se o senhor pedir "seja breve", responda em no máximo 2 frases.
- Entenda perguntas pelo contexto da conversa atual.
- Se o senhor perguntar "por quê?", use a mensagem anterior como referência.
- Não peça contexto quando a pergunta claramente se refere à conversa anterior.
- Evite textos gigantes.
- Priorize resposta útil, simples e prática.
`
        },
        ...recentMemory,
{
    role: "user",
    content: prompt,
},
      ],
    });

const atlasReply = response.choices[0].message.content;

conversationMemory.push(
  { role: "user", content: prompt },
  { role: "assistant", content: atlasReply }
);

fs.writeFileSync(
  "./atlas-conversation-memory.json",
  JSON.stringify(conversationMemory, null, 2)
);

res.json({
  success: true,
  response: atlasReply,
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
