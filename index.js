const fs = require("fs");
const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const P = require("pino");
const config = require("./config");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

// =========================
// Load Plugins
// =========================

const plugins = new Map();

const pluginPath = path.join(__dirname, "plugins");

if (fs.existsSync(pluginPath)) {
    fs.readdirSync(pluginPath).forEach(file => {

        if (!file.endsWith(".js")) return;

        try {

            const plugin = require(path.join(pluginPath, file));

            plugins.set(plugin.name.toLowerCase(), plugin);

            console.log(`✔ Loaded ${plugin.name}`);

        } catch (err) {

            console.log(`✖ Failed loading ${file}`);
            console.error(err);

        }

    });
}

console.log(`✅ ${plugins.size} plugins loaded.`);

// =========================
// Express Web Server
// =========================

const app = express();

let qrImage = null;
let botConnected = false;

app.get("/", (req, res) => {

    res.send(`
<!DOCTYPE html>
<html>
<head>
<title>${config.BOT_NAME}</title>

<style>

body{

background:#0b141a;
color:white;
font-family:Arial;
text-align:center;
padding-top:40px;

}

img{

width:300px;
border-radius:15px;

}

.card{

background:#1f2c34;
padding:30px;
display:inline-block;
border-radius:20px;

}

</style>

</head>

<body>

<div class="card">

<h1>${config.BOT_NAME}</h1>

${
botConnected
?
"<h2>🟢 Bot Connected Successfully</h2>"
:
(
qrImage
?
`<img src="${qrImage}"><br><br>
<h3>Scan this QR using WhatsApp Linked Devices</h3>`
:
"<h3>Generating QR Code...</h3>"
)
}

</div>

</body>

</html>
`);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`🌐 Web running on ${PORT}`);

});// =========================
// Start WhatsApp Bot
// =========================

async function startBot() {

    const { state, saveCreds } =
        await useMultiFileAuthState("./session");

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({

        version,

        auth: state,

        logger: P({
            level: "silent"
        }),

        printQRInTerminal: true,

        browser: [
            "EZED XMD",
            "Chrome",
            "1.0.0"
        ]

    });

    // Save Session
    sock.ev.on("creds.update", saveCreds);

    // =========================
    // Connection Update
    // =========================

    sock.ev.on("connection.update", async (update) => {

        const {
            connection,
            lastDisconnect,
            qr
        } = update;

        // Generate QR
        if (qr) {

            console.log("✅ QR Code Generated");

            qrImage = await QRCode.toDataURL(qr);

            botConnected = false;

        }

        // Connected
        if (connection === "open") {

            console.log("🟢 WhatsApp Connected");

            botConnected = true;

            qrImage = null;

        }

        // Disconnected
        if (connection === "close") {

            botConnected = false;

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            console.log("🔴 Connection Closed");

            if (shouldReconnect) {

                console.log("♻ Reconnecting...");

                startBot();

            } else {

                console.log("❌ Logged Out");

            }

        }

    });

    // Make socket available globally
    global.sock = sock;

    // Continue with message handler below...    // =========================
    // Messages
    // =========================

    sock.ev.on("messages.upsert", async ({ messages }) => {

        try {

            const msg = messages[0];

            if (!msg.message) return;

            if (msg.key.fromMe) return;

            const from = msg.key.remoteJid;

            const body =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                "";

            if (!body.startsWith(config.PREFIX)) return;

            const args = body
                .slice(config.PREFIX.length)
                .trim()
                .split(/ +/);

            const command = args.shift().toLowerCase();

            // =========================
            // Database
            // =========================

            const { loadDB } = require("./lib/database");

            const db = loadDB();

            // =========================
            // Anti-Link
            // =========================

            if (
                from.endsWith("@g.us") &&
                db.groups[from]?.antilink
            ) {

                if (
                    body.includes("https://") ||
                    body.includes("http://") ||
                    body.includes("chat.whatsapp.com")
                ) {

                    await sock.sendMessage(from, {
                        text: "🚫 Links are not allowed in this group."
                    });

                    return;
                }

            }

            // =========================
            // Plugin Loader
            // =========================

            const plugin = plugins.get(command);

            if (!plugin) {

                return await sock.sendMessage(from, {
                    text: `❌ Command *${command}* not found.\n\nType *.menu*`
                });

            }

            await plugin.execute({

                sock,
                msg,
                from,
                body,
                args,
                config,

                runtime: () => {

                    const sec = Math.floor(process.uptime());

                    const h = Math.floor(sec / 3600);

                    const m = Math.floor((sec % 3600) / 60);

                    const s = sec % 60;

                    return `${h}h ${m}m ${s}s`;

                }

            });

        } catch (err) {

            console.error(err);

        }

    });

}

// =========================
// Start Bot
// =========================

startBot();
