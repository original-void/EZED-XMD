module.exports = {
    name: "menu",

    async execute({ sock, from }) {

        const menu = `
╭━━━〔 🤖 EZED XMD 〕━━━╮

📌 GENERAL

• .menu
• .ping
• .alive
• .owner
• .ai

━━━━━━━━━━━━━━

👑 OWNER

• .restart
• .shutdown
• .broadcast

━━━━━━━━━━━━━━

👥 GROUP

• .kick
• .add
• .promote
• .demote
• .tagall

━━━━━━━━━━━━━━

🤖 AI

• .ai
• .chat
• .ask

━━━━━━━━━━━━━━

⚡ Version : 1.0
👑 Owner : EZED X TECH

╰━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(from, {
            text: menu
        });

    }
};
