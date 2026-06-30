const fs = require("fs");
const path = require("path");

const plugins = new Map();
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const QRCode = require("qrcode");
const P = require("pino");
const path = require("path");

let qrImage = "";
let connected = false;
let sock = null;

async function startBot() {

    const sessionFolder = path.join(__dirname, "..", "session");

    const { state, saveCreds } =
        await useMultiFileAuthState(sessionFolder);

    const { version } =
        await fetchLatestBaileysVersion();

    console.log("Starting WhatsApp...");

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: "silent" }),
        browser: ["EZED XMD", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {

        const { connection, qr, lastDisconnect } = update;

        console.log(update);

        if (qr) {
            console.log("✅ QR RECEIVED");
            qrImage = await QRCode.toDataURL(qr);
            connected = false;
        }

        if (connection === "open") {
            console.log("🟢 Connected");
            connected = true;
            qrImage = "";
        }

        if (connection === "close") {

            connected = false;

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            if (shouldReconnect) {
                console.log("Reconnecting...");
                startBot();
            }
        }

    });

    return sock;
}

function getQR() {
    return qrImage;
}

function isConnected() {
    return connected;
}
function loadPlugins() {

    const pluginFolder = path.join(__dirname, "..", "plugins");

    if (!fs.existsSync(pluginFolder)) return;

    const files = fs.readdirSync(pluginFolder);

    for (const file of files) {

        if (!file.endsWith(".js")) continue;

        try {

            delete require.cache[
                require.resolve(path.join(pluginFolder, file))
            ];

            const plugin = require(path.join(pluginFolder, file));

            plugins.set(plugin.name.toLowerCase(), plugin);

            console.log("✅ Loaded:", plugin.name);

        } catch (err) {

            console.log("❌ Failed:", file);

            console.error(err);

        }

    }

}
module.exports = {
    startBot,
    getQR,
    isConnected
};
