const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());

app.use(express.json());
app.post("/atlas-login", (req, res) => {
  const { password } = req.body;
if ((password || "").trim() === (process.env.ATLAS_PASSWORD || "").trim()) {
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
background:
radial-gradient(circle at top, rgba(0,255,200,0.08), transparent 35%),
linear-gradient(135deg,#050816,#0b1020,#050816);
color:#00ffd5;
font-family:Arial;
margin:0;
height:100vh;
display:flex;
justify-content:center;
align-items:center;
overflow:hidden;
position:relative;
}

        .container{
width:760px;
background:rgba(12,18,35,0.88);
border:1px solid rgba(0,255,200,0.25);
border-radius:30px;
padding:30px;
backdrop-filter:blur(20px);

box-shadow:
0 0 25px rgba(0,255,200,0.18),
0 0 60px rgba(0,150,255,0.12);

position:relative;
overflow:hidden;
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
display:flex;
justify-content:center;
align-items:center;
height:100vh;
background:
radial-gradient(circle at top, rgba(0,255,200,0.08), transparent 40%),
linear-gradient(135deg,#050816,#0b1020,#050816);
position:fixed;
top:0;
left:0;
width:100%;
z-index:9999;
overflow:hidden;
">

<div style="
position:absolute;
width:100%;
height:100%;
background-image:
linear-gradient(rgba(0,255,200,0.05) 1px, transparent 1px),
linear-gradient(90deg, rgba(0,255,200,0.05) 1px, transparent 1px);
background-size:40px 40px;
opacity:0.25;
"></div>

<div style="
position:relative;
width:340px;
padding:35px 30px;
border-radius:22px;
background:rgba(10,15,30,0.88);
border:1px solid rgba(0,255,200,0.25);
backdrop-filter:blur(18px);
box-shadow:
0 0 25px rgba(0,255,200,0.18),
0 0 60px rgba(0,150,255,0.12);
text-align:center;
">

<h1 style="
font-size:52px;
margin-bottom:8px;
color:#9fffd5;
letter-spacing:4px;
text-shadow:0 0 18px rgba(0,255,200,0.45);
">
A.T.L.A.S
</h1>

<div style="
color:#8aa0c8;
font-size:13px;
margin-bottom:28px;
letter-spacing:2px;
">
SECURE ACCESS SYSTEM
</div>

<input
id="atlasPassword"
type="password"
placeholder="ENTER PASSWORD"
style="
width:100%;
padding:16px;
border-radius:14px;
border:1px solid rgba(0,255,200,0.18);
background:#0d1325;
color:white;
font-size:15px;
outline:none;
box-sizing:border-box;
margin-bottom:18px;
box-shadow:0 0 15px rgba(0,255,200,0.08);
"
/>

<button
onclick="loginAtlas()"
style="
width:100%;
padding:15px;
border:none;
border-radius:14px;
background:linear-gradient(135deg,#8fffd5,#6de0ff);
color:#041018;
font-weight:bold;
font-size:15px;
cursor:pointer;
letter-spacing:1px;
box-shadow:
0 0 20px rgba(0,255,200,0.28);
transition:0.3s;
">
ACCESS A.T.L.A.S
</button>

<div id="loginError" style="margin-top:15px;color:#ff6b6b;font-size:13px;display:none;">ACCESS DENIED</div>

</div>
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

<button onclick="startVoiceInput()">🎤</button>

<button onclick="sendMessage()">
SEND
</button>
        </div>

      </div>

      <script>

function speakAtlas(text) {
  if (!text) return;

  const cleanText = String(text);

  const voice = new SpeechSynthesisUtterance(cleanText);

const voices = window.speechSynthesis.getVoices();

voice.voice =
voices.find(v =>
  v.lang.includes("pt") &&
  (
    v.name.toLowerCase().includes("male") ||
    v.name.toLowerCase().includes("masculino") ||
    v.name.toLowerCase().includes("antonio") ||
    v.name.toLowerCase().includes("daniel")
  )
) ||
voices.find(v => v.lang.includes("pt")) ||
voices[0];

voice.lang = "pt-BR";
voice.rate = 1.39;
voice.pitch = 1;
voice.volume = 1;

const parts = cleanText
  .split(/(?<=[.!?])\s+/)
  .filter(part => part.trim().length > 0);

window.speechSynthesis.cancel();

parts.forEach(part => {
  const speech = new SpeechSynthesisUtterance(part);

  speech.voice = voice.voice;
  speech.lang = "pt-BR";
  speech.rate = 1.22;
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
});
}
function startVoiceInput() {

const recognition =
new(window.SpeechRecognition ||
window.webkitSpeechRecognition)();

recognition.lang = "pt-BR";

recognition.start();

recognition.onresult = function(event) {

const voiceText =
event.results[0][0].transcript;

document.getElementById("prompt").value =
voiceText;

sendMessage();

};

recognition.onerror = function(event) {

console.log(event.error);

};

}

async function loginAtlas() {
  const passwordInput =
  document.getElementById("atlasPassword");

  const loginError =
  document.getElementById("loginError");

  const password =
  passwordInput.value.trim();

  loginError.style.display = "none";
  loginError.innerText = "";

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

    loginError.innerText =
    "ACCESS DENIED";

    loginError.style.display =
    "block";
  }
}

document.getElementById("atlasPassword")
.addEventListener("keydown",
function(event) {

  if (event.key === "Enter") {
    loginAtlas();
  }

});

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

          const atlasText =
data.response || data.error || "AI Core aguardando créditos da OpenAI API.";

chat.innerHTML +=
'<div class="message atlas">🤖 A.T.L.A.S: ' + atlasText + '</div>';

chat.scrollTop = chat.scrollHeight;

speakAtlas(atlasText);
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
//update
