module.exports = {

    name: "ping",

    async execute({ sock, from }) {

        const start = Date.now();

        const speed = Date.now() - start;

        const uptime = process.uptime();

        const hours = Math.floor(uptime / 3600);

        const minutes = Math.floor((uptime % 3600) / 60);

        const seconds = Math.floor(uptime % 60);

        await sock.sendMessage(from, {

            text:
`🏓 *PONG!*

⚡ Speed : ${speed} ms

🟢 Status : Online

⏳ Uptime : ${hours}h ${minutes}m ${seconds}s`

        });

    }

};
