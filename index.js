const express = require("express");
const config = require("./config");

const {
    startBot,
    getQR,
    isConnected
} = require("./lib/connection");

const app = express();

// ==========================
// Home Page
// ==========================

app.get("/", (req, res) => {

    const qr = getQR();

    const connected = isConnected();

    res.send(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<meta http-equiv="refresh" content="3">

<title>${config.BOT_NAME}</title>

<style>

body{

background:#111B21;

font-family:Arial;

text-align:center;

color:white;

margin-top:50px;

}

.card{

display:inline-block;

background:#202C33;

padding:30px;

border-radius:20px;

box-shadow:0px 0px 20px rgba(0,255,0,.2);

}

img{

width:300px;

border-radius:15px;

}

h1{

color:#00ff88;

}

</style>

</head>

<body>

<div class="card">

<h1>${config.BOT_NAME}</h1>

${
connected
?
`
<h2>🟢 WhatsApp Connected</h2>

<p>Bot is running successfully.</p>
`
:
(
qr
?
`
<img src="${qr}"/>

<br><br>

<b>Scan this QR using WhatsApp Linked Devices</b>
`
:
`
<h2>⌛ Waiting For QR Code...</h2>

<p>Refreshing every 3 seconds...</p>
`
)
}

</div>

</body>

</html>
`);

});

// ==========================
// Health Check
// ==========================

app.get("/status",(req,res)=>{

res.json({

bot:config.BOT_NAME,

connected:isConnected(),

uptime:process.uptime()

});

});

// ==========================
// Start Server
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(`🌍 Server Running On ${PORT}`);

});

// ==========================
// Start WhatsApp
// ==========================

startBot().catch(console.error);
