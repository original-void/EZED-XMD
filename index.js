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

// ==========================
// Load Plugins
// ==========================

const plugins = new Map();

const pluginDir = path.join(__dirname, "plugins");

if (fs.existsSync(pluginDir)) {

    for (const file of fs.readdirSync(pluginDir)) {

        if (!file.endsWith(".js")) continue;

        try {

            const plugin = require(path.join(pluginDir, file));

            plugins.set(plugin.name.toLowerCase(), plugin);

            console.log("Loaded:", plugin.name);

        } catch (err) {

            console.log("Plugin Error:", file);

            console.error(err);

        }

    }

}

console.log(`${plugins.size} plugins loaded.`);

// ==========================
// Web Server
// ==========================

const app = express();

let qrImage = null;
let connected = false;

app.get("/", (req, res) => {

    res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta http-equiv="refresh" content="5">

<title>${config.BOT_NAME}</title>

<style>

body{

background:#0B141A;

color:white;

font-family:Arial;

text-align:center;

padding-top:40px;

}

.card{

background:#202C33;

display:inline-block;

padding:25px;

border-radius:15px;

}

img{

width:300px;

border-radius:10px;

}

</style>

</head>

<body>

<div class="card">

<h1>${config.BOT_NAME}</h1>

${
connected
?
"<h2>🟢 Connected Successfully</h2>"
:
(
qrImage
?
`<img src="${qrImage}"><br><br><b>Scan this QR using Linked Devices</b>`
:
"<h2>⌛ Waiting for QR Code...</h2>"
)
}

</div>

</body>

</html>
`);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

console.log("Web running on", PORT);

});// ==========================
// Start WhatsApp
// ==========================

async function startBot() {

    const sessionPath = path.join(__dirname, "session");

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionPath);

    const { version } =
        await fetchLatestBaileysVersion();

    console.log("🚀 Starting WhatsApp...");
    console.log("Using Baileys Version:", version);

    const sock = makeWASocket({

        version,

        auth: state,

        printQRInTerminal: true,

        logger: P({
            level: "silent"
        }),

        browser: [
            config.BOT_NAME,
            "Chrome",
            "1.0.0"
        ]

    });

    global.sock = sock;

    sock.ev.on("creds.update", saveCreds);

    // ==========================
    // Connection Updates
    // ==========================

    sock.ev.on("connection.update", async (update) => {

        console.log("Connection Update:", update);

        const {
            connection,
            lastDisconnect,
            qr
        } = update;

        // QR RECEIVED
        if (qr) {

            console.log("✅ QR RECEIVED");

            qrImage = await QRCode.toDataURL(qr);

            connected = false;

        }

        // CONNECTED
        if (connection === "open") {

            console.log("🟢 WhatsApp Connected");

            connected = true;

            qrImage = null;

        }

        // DISCONNECTED
        if (connection === "close") {

            connected = false;

            console.log("🔴 Connection Closed");

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            if (shouldReconnect) {

                console.log("♻ Reconnecting in 3 seconds...");

                setTimeout(() => {

                    startBot();

                }, 3000);

            } else {

                console.log("❌ Logged Out");

            }

        }

    });

    // ==========================
    // Messages
    // ==========================    sock.ev.on("messages.upsert", async ({ messages }) => {

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

            // ==========================
            // Load Database
            // ==========================

            const { loadDB } = require("./lib/database");

            const db = loadDB();

            // Create group entry if missing
            if (from.endsWith("@g.us")) {

                if (!db.groups[from]) {

                    db.groups[from] = {
                        welcome: false,
                        antilink: false,
                        antidelete: false
                    };

                }

            }

            // ==========================
            // Anti-Link
            // ==========================

            if (
                from.endsWith("@g.us") &&
                db.groups[from].antilink
            ) {

                if (
                    body.includes("chat.whatsapp.com") ||
                    body.includes("http://") ||
                    body.includes("https://")
                ) {

                    await sock.sendMessage(from, {
                        text: "🚫 Links are not allowed."
                    });

                    return;

                }

            }

            // ==========================
            // Execute Plugin
            // ==========================

            const plugin = plugins.get(command);

            if (!plugin) {

                return await sock.sendMessage(from, {
                    text: `❌ Unknown command: ${command}\n\nType *.menu*`
                });

            }

            await plugin.execute({

                sock,
                msg,
                from,
                body,
                args,
                config,

                runtime() {

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

}// ==========================
// Start Bot
// ==========================

startBot()
.catch(err => {

    console.error("Bot Failed To Start");

    console.error(err);

});

// ==========================
// Auto Reload Plugins (Optional)
// ==========================

fs.watch(path.join(__dirname, "plugins"), (event, file) => {

    if (!file || !file.endsWith(".js")) return;

    try {

        delete require.cache[
            require.resolve(path.join(__dirname, "plugins", file))
        ];

        const plugin = require(path.join(__dirname, "plugins", file));

        plugins.set(plugin.name.toLowerCase(), plugin);

        console.log(`🔄 Reloaded Plugin: ${plugin.name}`);

    } catch (err) {

        console.error(err);

    }

});
