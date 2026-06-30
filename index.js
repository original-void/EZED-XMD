const express = require("express");
const config = require("./config");

const {
    startBot,
    getQR,
    isConnected
} = require("./lib/connection");

const app = express();

app.get("/", (req, res) => {

    const qr = getQR();

    const connected = isConnected();

    res.send(`
<!DOCTYPE html>

<html>

<head>

<meta http-equiv="refresh" content="3">

<title>${config.BOT_NAME}</title>

<style>

body{

background:#111b21;

color:white;

font-family:Arial;

text-align:center;

padding-top:50px;

}

.card{

display:inline-block;

background:#202c33;

padding:30px;

border-radius:15px;

}

img{

width:300px;

}

</style>

</head>

<body>

<div class="card">

<h1>${config.BOT_NAME}</h1>

${
connected
?
"<h2>🟢 WhatsApp Connected</h2>"
:
(
qr
?
`<img src="${qr}"><br><br><b>Scan QR Using Linked Devices</b>`
:
"<h2>⌛ Waiting For QR...</h2>"
)
}

</div>

</body>

</html>
`);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("Web Server Running On Port", PORT);

});

startBot();
