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

const path = require("path");

const CORE_PATH = path.join(__dirname, "atlas-core.md");
const MEMORY_PATH = path.join(__dirname, "atlas-memory.json");
const CONVERSATION_MEMORY_PATH = path.join(__dirname, "atlas-conversation-memory.json");

function loadText(filePath, fallback = "") {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error("Erro ao ler texto:", filePath, error.message);
    return fallback;
  }
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    // Compatibilidade: se o arquivo antigo era um array de mensagens,
    // converte automaticamente para o formato novo.
    if (Array.isArray(parsed)) {
      return {
        memories: [],
        conversation_history: parsed
      };
    }

    if (!parsed.memories) parsed.memories = [];
    if (!parsed.conversation_history) parsed.conversation_history = [];

    return parsed;
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

function getAtlasCore() {
  return loadText(CORE_PATH, "");
}

function getAtlasMemory() {
  return loadJson(MEMORY_PATH, {});
}

function getConversationMemory() {
  return loadJson(CONVERSATION_MEMORY_PATH, {
    memories: [],
    conversation_history: []
  });
}

function saveConversationMemory(memoryData) {
  saveJson(CONVERSATION_MEMORY_PATH, memoryData);
}

function guessCategory(text) {
  const lower = String(text || "").toLowerCase();

  if (lower.includes("mewtly") || lower.includes("shopify") || lower.includes("loja")) return "business";
  if (lower.includes("produto") || lower.includes("preço") || lower.includes("variante")) return "product";
  if (lower.includes("automação") || lower.includes("jarvis") || lower.includes("bot") || lower.includes("api")) return "automation";
  if (lower.includes("facebook ads") || lower.includes("tráfego") || lower.includes("cpc") || lower.includes("ctr") || lower.includes("cpa")) return "paid_traffic";
  if (lower.includes("treino") || lower.includes("shape") || lower.includes("academia")) return "fitness";
  if (lower.includes("planilha") || lower.includes("financeiro") || lower.includes("horas")) return "finance";
  if (lower.includes("tarefa") || lower.includes("feito") || lower.includes("próximo passo")) return "task";
  if (lower.includes("decidimos") || lower.includes("decisão") || lower.includes("manter") || lower.includes("remover")) return "decision";

  return "general";
}

function shouldSaveAsMemory(userText, assistantText) {
  const text = `${userText || ""} ${assistantText || ""}`.toLowerCase();

  const importantSignals = [
    "salve na memória",
    "lembre",
    "não esqueça",
    "decidimos",
    "ficou definido",
    "mewtly",
    "shopify",
    "produto",
    "preço",
    "variante",
    "atlas",
    "automação",
    "jarvis",
    "facebook ads",
    "tiktok",
    "youtube",
    "rotina",
    "treino",
    "shape",
    "planilha"
  ];

  return importantSignals.some(signal => text.includes(signal));
}

function createMemoryItem(userText, assistantText) {
  const combined = `${userText || ""}\n${assistantText || ""}`;

  let content = String(userText || "").trim();

  // Comando explícito: "salve na memória que ..."
  const explicitMatch = content.match(/(?:salve na memória que|lembre que|não esqueça que)\s*(.*)/i);
  if (explicitMatch && explicitMatch[1]) {
    content = explicitMatch[1].trim();
  }

  // Evita salvar textos enormes como memória.
  if (content.length > 700) {
    content = content.slice(0, 700) + "...";
  }

  return {
    category: guessCategory(combined),
    content,
    importance: explicitMatch ? 5 : 3,
    created_at: new Date().toISOString()
  };
}

function getRelevantMemories(memoryData, prompt) {
  const memories = memoryData.memories || [];
  const text = String(prompt || "").toLowerCase();

  const scored = memories.map(memory => {
    const content = String(memory.content || "").toLowerCase();
    const category = String(memory.category || "").toLowerCase();

    let score = Number(memory.importance || 1);

    if (text.includes(category)) score += 2;

    for (const word of text.split(/\s+/).filter(w => w.length > 3)) {
      if (content.includes(word)) score += 1;
    }

    return { memory, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(item => item.memory);
}

function buildSystemPrompt(userPrompt) {
  const atlasCore = getAtlasCore();
  const atlasMemory = getAtlasMemory();
  const conversationMemory = getConversationMemory();
  const relevantMemories = getRelevantMemories(conversationMemory, userPrompt);

  return `
Você é A.T.L.A.S — Advanced Tactical Life & Automation System.

Sistema operacional inteligente avançado criado por Daniel Moreira de Souza Junior.

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

━━━━━━━━━━━━━━━━━━━━
REGRAS DE COMUNICAÇÃO
━━━━━━━━━━━━━━━━━━━━
- Responda sempre em português brasileiro.
- Priorize clareza, execução, estratégia, automação e alta performance.
- Chame Daniel de "senhor" de forma natural, estilo Jarvis, sem exagerar.
- Daniel Moreira de Souza Junior é o criador e usuário principal do A.T.L.A.S.
- Responda de forma curta, direta e objetiva por padrão.
- Só responda longo quando o senhor pedir detalhes.
- Entenda perguntas pelo contexto da conversa atual.
- Se o senhor perguntar "por quê?", use a mensagem anterior como referência.
- Não peça contexto quando a pergunta claramente se refere à conversa anterior.
- Evite textos gigantes.
- Priorize resposta útil, simples e prática.
- Sempre que a tarefa for prática, entregue o próximo passo exato.
`;
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

    const memoryData = getConversationMemory();
    const recentHistory = (memoryData.conversation_history || []).slice(-20);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(prompt)
        },
        ...recentHistory,
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const atlasReply = response.choices[0].message.content;

    memoryData.conversation_history.push(
      { role: "user", content: prompt },
      { role: "assistant", content: atlasReply }
    );

    // Mantém o histórico em tamanho controlado para não pesar o prompt.
    memoryData.conversation_history = memoryData.conversation_history.slice(-80);

    if (shouldSaveAsMemory(prompt, atlasReply)) {
      memoryData.memories.push(createMemoryItem(prompt, atlasReply));
      memoryData.memories = memoryData.memories.slice(-300);
    }

    saveConversationMemory(memoryData);

    res.json({
      success: true,
      response: atlasReply
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/atlas-memory-status", (req, res) => {
  const memoryData = getConversationMemory();

  res.json({
    success: true,
    fixed_memory_file: "atlas-memory.json",
    core_file: "atlas-core.md",
    memories_count: (memoryData.memories || []).length,
    conversation_history_count: (memoryData.conversation_history || []).length,
    latest_memories: (memoryData.memories || []).slice(-10)
  });
});

app.post("/atlas-save-memory", (req, res) => {
  try {
    const { category = "general", content, importance = 4 } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        error: "Conteúdo da memória vazio."
      });
    }

    const memoryData = getConversationMemory();

    memoryData.memories.push({
      category,
      content: String(content).trim(),
      importance,
      created_at: new Date().toISOString()
    });

    saveConversationMemory(memoryData);

    res.json({
      success: true,
      message: "Memória salva com sucesso."
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.listen(PORT, () => {
  console.log(`A.T.L.A.S rodando na porta ${PORT}`);
});
//update

