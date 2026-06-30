const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const QRCode = require("qrcode");
const P = require("pino");
const path = require("path");
const fs = require("fs");

let qrImage = "";
let connected = false;
let sock = null;

// =====================
// Plugin Loader
// =====================

const plugins = new Map();

function loadPlugins() {

    const pluginFolder = path.join(__dirname, "..", "plugins");

    if (!fs.existsSync(pluginFolder)) {
        fs.mkdirSync(pluginFolder);
        return;
    }

    plugins.clear();

    const files = fs.readdirSync(pluginFolder);

    for (const file of files) {

        if (!file.endsWith(".js")) continue;

        try {

            delete require.cache[
                require.resolve(path.join(pluginFolder, file))
            ];

            const plugin = require(path.join(pluginFolder, file));

            plugins.set(plugin.name.toLowerCase(), plugin);

            console.log(`✅ Loaded Plugin: ${plugin.name}`);

        } catch (err) {

            console.log(`❌ Failed: ${file}`);

            console.error(err);

        }

    }

}

// =====================
// Start Bot
// =====================

async function startBot() {

    loadPlugins();

    const sessionFolder = path.join(__dirname, "..", "session");

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionFolder);

    const { version } =
        await fetchLatestBaileysVersion();

    console.log("🚀 Starting EZED XMD...");

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

    sock.ev.on("creds.update", saveCreds);

    // =====================
    // Connection
    // =====================

    sock.ev.on("connection.update", async (update) => {

        const {
            connection,
            qr,
            lastDisconnect
        } = update;

        if (qr) {

            console.log("✅ QR Generated");

            qrImage = await QRCode.toDataURL(qr);

            connected = false;

        }

        if (connection === "open") {

            console.log("🟢 WhatsApp Connected");

            connected = true;

            qrImage = "";

        }

        if (connection === "close") {

            connected = false;

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            if (shouldReconnect) {

                console.log("♻ Reconnecting...");

                startBot();

            }

        }

    });

// =====================
// Messages
// =====================

sock.ev.on("messages.upsert", async ({ messages, type }) => {

    if (type !== "notify") return;

    const msg = messages[0];

    if (!msg) return;

    if (msg.key.remoteJid === "status@broadcast") return;

    if (msg.key.fromMe) return;

    if (msg.message?.ephemeralMessage) {
        msg.message = msg.message.ephemeralMessage.message;
    }

    console.log("📩 Message Received");

    const from = msg.key.remoteJid;

    const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

    console.log("Body:", body);

    if (!body.startsWith(".")) return;

    const args = body.slice(1).trim().split(/\s+/);

    const command = args.shift().toLowerCase();

    console.log("Command:", command);

    const plugin = plugins.get(command);

    if (!plugin) {

        return await sock.sendMessage(from, {
            text: `❌ Command "${command}" not found`
        });

    }

    try {

        await plugin.execute({
            sock,
            msg,
            from,
            body,
            args
        });

    } catch (err) {

        console.error("Plugin Error:", err);

        await sock.sendMessage(from, {
            text: "❌ Error executing command."
        });

    }

});
