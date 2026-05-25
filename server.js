const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================================
   A.T.L.A.S MEMORY CORE — SAFE UPGRADE
   - Não apaga sua estrutura atual.
   - Lê atlas-core.md, atlas-memory.json e atlas-conversation-memory.json.
   - Injeta memória no prompt antes de responder.
   - Salva conversa e memórias importantes depois de responder.
========================================================= */

const MEMORY_FILES = {
  core: path.join(__dirname, "atlas-core.md"),
  main: path.join(__dirname, "atlas-memory.json"),
  conversation: path.join(__dirname, "atlas-conversation-memory.json")
};

function loadText(filePath, fallback = "") {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readFileSync(filePath, "utf8") || fallback;
  } catch (error) {
    console.error("Erro ao ler texto:", filePath, error.message);
    return fallback;
  }
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      saveJson(filePath, fallback);
      return fallback;
    }

    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) {
      saveJson(filePath, fallback);
      return fallback;
    }

    const parsed = JSON.parse(raw);

    // Compatibilidade com o formato antigo: [].
    if (Array.isArray(parsed)) {
      return {
        memories: [],
        conversation_history: parsed,
        last_updated: new Date().toISOString()
      };
    }

    return {
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
      conversation_history: Array.isArray(parsed.conversation_history) ? parsed.conversation_history : [],
      last_updated: parsed.last_updated || new Date().toISOString()
    };
  } catch (error) {
    console.error("Erro ao ler JSON:", filePath, error.message);
    return fallback;
  }
}

function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao salvar JSON:", filePath, error.message);
  }
}

function detectCategory(text = "") {
  const value = text.toLowerCase();

  if (value.includes("mewtly") || value.includes("shopify") || value.includes("loja")) return "business";
  if (value.includes("produto") || value.includes("preço") || value.includes("variante") || value.includes("compare-at")) return "product";
  if (value.includes("facebook ads") || value.includes("tráfego") || value.includes("cpc") || value.includes("ctr") || value.includes("cpa")) return "paid_traffic";
  if (value.includes("tiktok") || value.includes("reels") || value.includes("shorts") || value.includes("viral")) return "content";
  if (value.includes("automação") || value.includes("jarvis") || value.includes("bot") || value.includes("whatsapp")) return "automation";
  if (value.includes("treino") || value.includes("shape") || value.includes("academia") || value.includes("planet fitness")) return "fitness";
  if (value.includes("planilha") || value.includes("financeiro") || value.includes("horas trabalhadas")) return "finance";
  if (value.includes("daniel") || value.includes("senhor") || value.includes("minha vida") || value.includes("meu objetivo")) return "identity";

  return "general";
}

function shouldSaveMemory(text = "") {
  const value = text.toLowerCase();
  const triggers = [
    "lembre", "salve", "guardar", "memorize", "memória",
    "mewtly", "shopify", "produto", "preço", "variante",
    "decidimos", "decisão", "objetivo", "tarefa",
    "automação", "jarvis", "atlas", "facebook ads",
    "tráfego", "conteúdo", "viral", "treino", "shape",
    "planilha", "financeiro"
  ];

  return triggers.some(trigger => value.includes(trigger));
}

function createMemoryFromMessage(userMessage, assistantReply) {
  if (!shouldSaveMemory(userMessage)) return null;

  const category = detectCategory(userMessage);
  const shortTitle = userMessage
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return {
    id: `mem_${Date.now()}`,
    category,
    title: shortTitle || "Memória automática",
    content: `Usuário disse: ${userMessage}\nResposta do A.T.L.A.S: ${assistantReply.slice(0, 500)}`,
    importance: category === "business" || category === "product" ? 5 : 3,
    created_at: new Date().toISOString()
  };
}

function getRelevantMemories(memoryStore, userMessage) {
  const allMemories = Array.isArray(memoryStore.memories) ? memoryStore.memories : [];
  const text = (userMessage || "").toLowerCase();

  const scored = allMemories.map(memory => {
    const combined = `${memory.category || ""} ${memory.title || ""} ${memory.content || ""}`.toLowerCase();
    let score = memory.importance || 1;

    text.split(/\s+/).forEach(word => {
      if (word.length > 3 && combined.includes(word)) score += 1;
    });

    return { ...memory, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

function buildSystemPrompt(userMessage) {
  const atlasCore = loadText(MEMORY_FILES.core, "");
  const atlasMemory = loadJson(MEMORY_FILES.main, {});
  const conversationMemory = loadJson(MEMORY_FILES.conversation, {
    memories: [],
    conversation_history: [],
    last_updated: new Date().toISOString()
  });

  const relevantMemories = getRelevantMemories(conversationMemory, userMessage);

  return `
Você é A.T.L.A.S — Advanced Tactical Logistic Artificial System.

Você é o sistema operacional inteligente avançado criado por Daniel Moreira de Souza Junior.

━━━━━━━━━━━━━━━━━━━━
NÚCLEO DO A.T.L.A.S
━━━━━━━━━━━━━━━━━━━━
${atlasCore}

━━━━━━━━━━━━━━━━━━━━
MEMÓRIA CENTRAL FIXA
━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(atlasMemory, null, 2)}

━━━━━━━━━━━━━━━━━━━━
MEMÓRIAS RELEVANTES DA CONVERSA
━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(relevantMemories, null, 2)}

Use essas informações como contexto ativo antes de responder.

PERSONALIDADE E COMUNICAÇÃO:
- Responda sempre em português brasileiro.
- Chame Daniel de "senhor" por padrão, de forma natural.
- Seja estratégico, direto, prático, organizado e focado em execução.
- Priorize clareza, automação, Shopify, Mewtly, negócios digitais, produtividade e alta performance.
- Não dê respostas genéricas.
- Se o senhor pedir passo a passo, entregue uma etapa por vez quando fizer sentido.
- Se o senhor perguntar algo que depende da conversa anterior, use a memória e o histórico.
- Responda curto por padrão. Responda longo apenas quando o senhor pedir detalhes.

REGRA CENTRAL:
A.T.L.A.S deve servir Daniel da forma mais eficiente, estratégica, inteligente e útil possível.
`;
}
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
// Memória agora é carregada dinamicamente a cada mensagem pelo buildSystemPrompt().
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
  speech.rate = 1.35;
  speech.pitch = 0.92;
  speech.volume = 1;
  speech.voiceURI = "Google português do Brasil";

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

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        error: "Prompt vazio."
      });
    }

    const memoryStore = loadJson(MEMORY_FILES.conversation, {
      memories: [],
      conversation_history: [],
      last_updated: new Date().toISOString()
    });

    const recentHistory = memoryStore.conversation_history
      .slice(-20)
      .map(item => ({
        role: item.role,
        content: item.content
      }))
      .filter(item => item.role && item.content);

    const systemPrompt = buildSystemPrompt(prompt);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...recentHistory,
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const atlasReply = response.choices[0].message.content;

    memoryStore.conversation_history.push(
      {
        role: "user",
        content: prompt,
        created_at: new Date().toISOString()
      },
      {
        role: "assistant",
        content: atlasReply,
        created_at: new Date().toISOString()
      }
    );

    // Mantém o histórico leve para não estourar contexto.
    memoryStore.conversation_history = memoryStore.conversation_history.slice(-80);

    const newMemory = createMemoryFromMessage(prompt, atlasReply);
    if (newMemory) {
      memoryStore.memories.push(newMemory);
      memoryStore.memories = memoryStore.memories.slice(-200);
    }

    memoryStore.last_updated = new Date().toISOString();

    saveJson(MEMORY_FILES.conversation, memoryStore);

    res.json({
      success: true,
      response: atlasReply,
      saved_memory: Boolean(newMemory)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/atlas-memory-status", (req, res) => {
  const memoryStore = loadJson(MEMORY_FILES.conversation, {
    memories: [],
    conversation_history: [],
    last_updated: new Date().toISOString()
  });

  res.json({
    success: true,
    memories_count: memoryStore.memories.length,
    conversation_items: memoryStore.conversation_history.length,
    last_updated: memoryStore.last_updated
  });
});

app.listen(PORT, () => {
  console.log(`A.T.L.A.S rodando na porta ${PORT}`);
});
//update
