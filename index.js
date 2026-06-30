async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    console.log("Starting bot...");
    console.log("Version:", version);

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: true,
        logger: P({ level: "debug" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        console.log("UPDATE:", update);

        if (update.qr) {
            console.log("QR RECEIVED");
            qrImage = await QRCode.toDataURL(update.qr);
        }

        if (update.connection === "open") {
            console.log("CONNECTED");
        }

        if (update.connection === "close") {
            console.log("CLOSED");
        }
    });
}

startBot();
