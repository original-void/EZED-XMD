const express = require('express');
const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_NAME = 'EZED XMD V1';
const OWNER = '254769532338@s.whatsapp.net'; // <-- PUT YOUR NUMBER HERE
const AUTH = 'auth';

// V1 RULE: Always delete old session on Render
if (fs.existsSync(AUTH)) fs.rmSync(AUTH, { recursive: true, force: true });

let QR = null;
let sock;

app.get('/', async (req, res) => {
    if (!QR) return res.send(`<h1>${BOT_NAME}</h1><p>Waiting QR... refresh</p><meta http-equiv="refresh" content="10">`);
    const img = await QRCode.toDataURL(QR);
    res.send(`<h1>Scan ${BOT_NAME}</h1><img src="${img}" width="300"/>`);
});
app.listen(PORT);

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH);

    sock = makeWASocket({
        logger: pino({ level: 'debug' }),
        auth: state,
        browser: [BOT_NAME, 'Chrome', '1.0.0'],
        qrTimeout: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (s) => {
        const { connection, qr, lastDisconnect } = s;
        if (qr) { QR = qr; console.log('QR READY'); }
        if (connection === 'open') {
            QR = null;
            console.log('CONNECTED');
            await sock.sendMessage(OWNER, { text: `✅ ${BOT_NAME} Online` });
        }
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) start();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (from!== OWNER) return sock.sendMessage(from, { text: `❌ Private Bot` });
        
        if (text === '.ping') {
            const t = Date.now();
            const x = await sock.sendMessage(from, { text: 'pong...' });
            await sock.sendMessage(from, { text: `pong ${Date.now()-t}ms`, edit: x.key });
        }
        if (text === '.menu') {
            await sock.sendMessage(from, { text: `*${BOT_NAME}*\n\n.ping\n.menu\nOwner: EZED` });
        }
    });
}
start();
