const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const express = require("express");
const P = require("pino");
const QRCode = require("qrcode");

const app = express();

let qrData = "Loading QR Code...";

app.get("/", async (req, res) => {
    if (!qrData.startsWith("data:image")) {
        return res.send("<h2>QR Code not generated yet. Refresh after a few seconds.</h2>");
    }

    res.send(`
    <html>
    <head>
        <title>EZED XMD QR</title>
    </head>
    <body style="text-align:center;font-family:Arial;background:#111;color:white;">
        <h1>EZED XMD</h1>
        <h3>Scan QR Code</h3>
        <img src="${qrData}" width="300"/>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: "silent" }),
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {

        if (qr) {
            qrData = await QRCode.toDataURL(qr);
            console.log("QR Generated");
        }

        if (connection === "close") {

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                startBot();
            }

        } else if (connection === "open") {

            console.log("✅ EZED XMD Connected!");

        }

    });

    sock.ev.on("messages.upsert", async ({ messages }) => {

        const msg = messages[0];

        if (!msg.message) return;

        const from = msg.key.remoteJid;

        const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        if (body === ".ping") {
            await sock.sendMessage(from, {
                text: "🏓 Pong!\nEZED XMD is Online."
            });
        }

        if (body === ".alive") {
            await sock.sendMessage(from, {
                text: "✅ EZED XMD is Running Successfully."
            });
        }

    });

}

startBot();
