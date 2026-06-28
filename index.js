global.crypto = require('crypto'); // CRITICAL FIX FOR RENDER NODE 24

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
const BOT_NAME = 'EZED XMD V1.2';
const OWNER = '254769532338@s.whatsapp.net'; // <-- CHANGE TO YOUR NUMBER WITH 254
const AUTH = 'auth';

// V1 RULE: Always delete old session on Render to force new QR
if (fs.existsSync(AUTH)) fs.rmSync(AUTH, { recursive: true, force: true });

let QR = null;
let sock;

app.get('/', async (req, res) => {
    if (!QR) return res.send(`
        <div style="text-align:center;padding:50px;background:#000;color:#00ff88;font-family:sans-serif;">
        <h1>⚡ ${BOT_NAME} ⚡</h1>
        <h2>Waiting QR...</h2>
        <p>Refresh this page in 10s</p>
        <meta http-equiv="refresh" content="10">
        </div>
    `);
    const img = await QRCode.toDataURL(QR);
    res.send(`
        <div style="text-align:center;padding:40px;background:#000;color:#00ff88;font-family:sans-serif;">
        <h1>⚡ Scan ${BOT_NAME} ⚡</h1>
        <img src="${img}" width="320" style="border:4px solid #00ff88;border-radius:20px;"/>
        <p>WhatsApp > Settings > Linked Devices > Link a Device</p>
        </div>
    `);
});
app.listen(PORT, () => console.log(`✅ Web: ${PORT}`));

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH);

    sock = makeWASocket({
        logger: pino({ level: 'debug' }),
        auth: state,
        browser: [BOT_NAME, 'Chrome', '1.0.0'],
        qrTimeout: 60000 // 60s wait for Render
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (s) => {
        const { connection, qr, lastDisconnect } = s;
        if (qr) { 
            QR = qr; 
            console.log('✅ QR READY - Open your Render URL'); 
        }
        if (connection === 'open') {
            QR = null;
            console.log('✅ CONNECTED');
            await sock.sendMessage(OWNER, { text: `✅ ${BOT_NAME} Online\nOwner Only: ON` });
        }
        if (connection === 'close') {
            QR = null;
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Closed:', code);
            if (code!== DisconnectReason.loggedOut) start();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (from!== OWNER) return sock.sendMessage(from, { text: `❌ ${BOT_NAME} is Private. Owner Only.` });
        
        if (text === '.ping') {
            const t = Date.now();
            const x = await sock.sendMessage(from, { text: '🏓 pong...' });
            await sock.sendMessage(from, { text: `🏓 pong ${Date.now()-t}ms\n⚡ ${BOT_NAME}`, edit: x.key });
        }
        if (text === '.menu') {
            await sock.sendMessage(from, { text: `*⚡ ${BOT_NAME}*\n\n.ping\n.menu\nStatus: ONLINE ✅` });
        }
    });
}
start();
