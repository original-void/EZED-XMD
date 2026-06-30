module.exports = {

    name: "alive",

    async execute({ sock, from }) {

        await sock.sendMessage(from, {

            text:
`🤖 EZED XMD

✅ Bot is Alive

🚀 Running Successfully

Developer:
EZED X TECH`

        });

    }

};
