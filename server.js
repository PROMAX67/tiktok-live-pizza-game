import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || "").replace(/^@/, "");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static("public"));

let clients = new Set();
let connection = null;
let status = { connected:false, username:TIKTOK_USERNAME };

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

wss.on("connection", ws => {
  clients.add(ws);
  ws.send(JSON.stringify({type:"status", ...status}));
  ws.on("close", () => clients.delete(ws));
});

function emitCommand(command, source, details={}) {
  broadcast({type:"command", command, source, details, at:Date.now()});
  console.log("COMMAND", command, source, details);
}

function giftName(data) {
  return String(
    data?.giftDetails?.giftName ??
    data?.extendedGiftInfo?.name ??
    data?.giftName ??
    data?.giftDetails?.name ??
    ""
  ).trim();
}

function giftDiamonds(data) {
  return Number(
    data?.giftDetails?.diamondCount ??
    data?.extendedGiftInfo?.diamondCount ??
    data?.diamondCount ?? 0
  ) || 0;
}

async function connectTikTok() {
  if (!TIKTOK_USERNAME) {
    console.error("Set TIKTOK_USERNAME, e.g. TIKTOK_USERNAME=yourusername");
    return;
  }

  connection = new TikTokLiveConnection(TIKTOK_USERNAME, {
    enableExtendedGiftInfo: true
  });

  connection.on(WebcastEvent.GIFT, data => {
    const name = giftName(data);
    const diamonds = giftDiamonds(data);
    const repeat = Number(data?.repeatCount || 1);
    const repeatEnd = data?.repeatEnd;

    // Avoid double-processing the end marker for streak gifts.
    if (data?.giftDetails?.giftType === 1 && repeatEnd === true) return;

    const n = name.toLowerCase();

    // Customize these mappings to the gifts you want.
    if (n.includes("rose")) {
      emitCommand("up50", "gift", {gift:name, diamonds, repeat});
    } else if (n.includes("finger heart") || n.includes("heart")) {
      emitCommand("down50", "gift", {gift:name, diamonds, repeat});
    } else if (n.includes("gg") || n.includes("lion") || n.includes("universe")) {
      emitCommand("up5000", "gift", {gift:name, diamonds, repeat});
    } else if (diamonds >= 500) {
      emitCommand("up500", "gift", {gift:name, diamonds, repeat});
    } else if (diamonds >= 100) {
      emitCommand("down500", "gift", {gift:name, diamonds, repeat});
    }

    broadcast({type:"gift", gift:name, diamonds, repeat});
  });

  connection.on(WebcastEvent.LIKE, data => {
    const count = Number(data?.likeCount || data?.count || 1);
    broadcast({type:"like", count});
    // Example: every 100 likes => UP 50
    if (count >= 100) emitCommand("up50", "likes", {count});
  });

  connection.on("connected", state => {
    status = {connected:true, username:TIKTOK_USERNAME, roomId:state?.roomId || ""};
    broadcast({type:"status", ...status});
    console.log("Connected to @"+TIKTOK_USERNAME);
  });

  connection.on("disconnected", () => {
    status = {connected:false, username:TIKTOK_USERNAME};
    broadcast({type:"status", ...status});
  });

  connection.on("error", err => {
    console.error("TikTok error:", err?.message || err);
    broadcast({type:"error", message:String(err?.message || err)});
  });

  try {
    await connection.connect();
  } catch (err) {
    console.error("Connect failed:", err?.message || err);
    broadcast({type:"error", message:String(err?.message || err)});
    setTimeout(connectTikTok, 10000);
  }
}

app.get("/health", (_, res) => res.json({ok:true, ...status}));

server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
  connectTikTok();
});
