const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const QRCode = require("qrcode");
const P = require("pino");
const fs = require("fs");
const path = require("path");

// =========================
// Variables
// =========================

let sock = null;
let qrImage = "";
let connected = false;

// =========================
// Plugin Loader
// =========================

const plugins = new Map();

function loadPlugins() {

    const pluginDir = path.join(__dirname, "..", "plugins");

    if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir);
        return;
    }

    plugins.clear();

    const files = fs.readdirSync(pluginDir);

    for (const file of files) {

        if (!file.endsWith(".js")) continue;

        try {

            delete require.cache[
                require.resolve(path.join(pluginDir, file))
            ];

            const plugin = require(path.join(pluginDir, file));

            if (!plugin.name || !plugin.execute) {
                console.log(`❌ Invalid Plugin: ${file}`);
                continue;
            }

            plugins.set(plugin.name.toLowerCase(), plugin);

            console.log(`✅ Loaded Plugin: ${plugin.name}`);

        } catch (err) {

            console.log(`❌ Failed Loading: ${file}`);

            console.error(err);

        }

    }

}// =========================
// Start WhatsApp
// =========================

async function startBot() {

    loadPlugins();

    const sessionPath = path.join(__dirname, "..", "session");

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionPath);

    const { version } =
        await fetchLatestBaileysVersion();

    console.log("🚀 Starting EZED XMD...");
    console.log("📦 Baileys Version:", version);

    sock = makeWASocket({

        version,

        auth: state,

        printQRInTerminal: true,

        logger: P({
            level: "silent"
        }),

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
            qr,
            lastDisconnect
        } = update;

        console.log("Connection Update:", update);

        // QR Generated

        if (qr) {

            console.log("✅ QR Code Generated");

            qrImage = await QRCode.toDataURL(qr);

            connected = false;

        }

        // Connected

        if (connection === "open") {

            console.log("🟢 WhatsApp Connected");

            connected = true;

            qrImage = "";

        }

        // Disconnected

        if (connection === "close") {

            connected = false;

            console.log("🔴 Connection Closed");

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            if (shouldReconnect) {

                console.log("♻ Reconnecting...");

                setTimeout(() => {

                    startBot();

                }, 3000);

            } else {

                console.log("❌ Logged Out");

            }

        }

    });    // =========================
    // Message Handler
    // =========================

    sock.ev.on("messages.upsert", async ({ messages, type }) => {

        try {

            if (type !== "notify") return;

            const msg = messages[0];

            if (!msg) return;

            if (msg.key.fromMe) return;

            if (msg.key.remoteJid === "status@broadcast") return;

            // Handle disappearing messages
            if (msg.message?.ephemeralMessage) {
                msg.message = msg.message.ephemeralMessage.message;
            }

            console.log("📩 New Message Received");

            const from = msg.key.remoteJid;

            const body =
                msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption ||
                "";

            console.log("Message:", body);

            if (!body.startsWith(".")) return;

            const args = body
                .slice(1)
                .trim()
                .split(/\s+/);

            const command = args.shift().toLowerCase();

            console.log("Command:", command);

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
                args

            });

        } catch (err) {

            console.error("❌ Message Error");

            console.error(err);

        }

    });

    return sock;

}// =========================
// Helper Functions
// =========================

function getQR() {
    return qrImage;
}

function isConnected() {
    return connected;
}

function getSock() {
    return sock;
}

// =========================
// Exports
// =========================

module.exports = {

    startBot,

    getQR,

    isConnected,

    getSock

};
