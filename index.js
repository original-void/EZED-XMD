global.crypto = require('crypto'); // RENDER FIX

const express = require('express');
const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    Browsers
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_NAME = 'EZED XMD V1.3';
const OWNER = '254769532338@s.whatsapp.net'; // CHANGE ME
const AUTH = 'auth';

// INSTANT QR TRICK: Delete auth + start bot immediately on boot
if (fs.existsSync(AUTH)) fs.rmSync(AUTH, { recursive: true, force: true });
console.log('🗑️ Auth deleted. Forcing new QR...');

let QR = null;
let QR_READY = false;
let sock;

app.get('/', async (req, res) => {
    if (!QR_READY) return res.send(`
        <h1>⚡ ${BOT_NAME} ⚡</h1>
        <h2>Generating QR... wait 3s</h2>
        <script>setTimeout(()=>location.reload(),3000)</script>
    `);
    const img = await QRCode.toDataURL(QR);
    res.send(`
        <div style="text-align:center;padding:20px;background:#000;color:#00ff88;">
        <h1>⚡ Scan NOW - Expires in 60s ⚡</h1>
        <img src="${img}" width="350" style="border:5px solid #00ff88;border-radius:20px;"/>
        <p>WhatsApp > Linked Devices > Link a Device</p>
        </div>
    `);
});
app.listen(PORT);

// KEEP ALIVE PING - Stops Render from sleeping during QR
setInterval(() => { 
    fetch(`http://localhost:${PORT}/`).catch(()=>{}); 
}, 25000);

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH);

    sock = makeWASocket({
        logger: pino({ level: 'silent' }), // Less log spam
        auth: state,
        browser: Browsers.macOS('Chrome'), // Looks more real to WA
        qrTimeout: 40000,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (s) => {
        const { connection, qr, lastDisconnect } = s;
        if (qr) { 
            QR = qr; 
            QR_READY = true;
            console.log('✅ QR IS LIVE NOW. OPEN URL'); 
        }
        if (connection === 'open') {
            QR_READY = false;
            console.log('✅ CONNECTED');
            await sock.sendMessage(OWNER, { text: `✅ ${BOT_NAME} Online` });
            process.exit(0); // Kill to stop QR loop on Render
        }
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) {
                start();
            }
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (from!== OWNER) return;
        
        if (text === '.ping') await sock.sendMessage(from, { text: `🏓 ${Date.now()-m.messageTimestamp*1000}ms` });
        if (text === '.menu') await sock.sendMessage(from, { text: `*${BOT_NAME}*\n.ping\n.menu` });
    });
}
start();
