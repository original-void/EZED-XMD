module.exports = {
    name: "menu",

    async execute({ sock, from, config, runtime }) {

        const menu = `
╭━━━━━━━━━━━━━━━━━━━━━━━
┃ 🤖 *${config.BOT_NAME}*
┃ 🚀 Version: ${config.VERSION}
╰━━━━━━━━━━━━━━━━━━━━━━━

👑 Owner: ${config.OWNER_NAME}
📱 Number: ${config.OWNER_NUMBER}
⚡ Prefix: ${config.PREFIX}
⏱ Runtime: ${runtime()}

━━━━━━━━━━━━━━━━━━━━━━━
📋 GENERAL
━━━━━━━━━━━━━━━━━━━━━━━
➤ .menu
➤ .ping
➤ .alive
➤ .bot
➤ .runtime
➤ .owner
➤ .help
➤ .listcmd
➤ .date
➤ .time
➤ .quote
➤ .calc
➤ .weather

━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━
➤ .ai
➤ .translate
➤ .summarize
➤ .code
➤ .fixcode
➤ .debug
➤ .explain

━━━━━━━━━━━━━━━━━━━━━━━
👥 GROUP COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━
➤ .kick
➤ .add
➤ .promote
➤ .demote
➤ .tagall
➤ .hidetag
➤ .tagadmins

━━━━━━━━━━━━━━━━━━━━━━━
🛡️ SECURITY
━━━━━━━━━━━━━━━━━━━━━━━
➤ .welcome on/off
➤ .antilink on/off
➤ .antidelete on/off
➤ .antispam on/off

━━━━━━━━━━━━━━━━━━━━━━━
🎨 STICKER
━━━━━━━━━━━━━━━━━━━━━━━
➤ .sticker
➤ .take
➤ .toimg
➤ .tomp3
➤ .tovideo

━━━━━━━━━━━━━━━━━━━━━━━
📥 DOWNLOAD
━━━━━━━━━━━━━━━━━━━━━━━
➤ .play
➤ .song
➤ .video
➤ .ytmp3
➤ .ytmp4
➤ .tiktok
➤ .facebook
➤ .instagram

━━━━━━━━━━━━━━━━━━━━━━━
👑 OWNER
━━━━━━━━━━━━━━━━━━━━━━━
➤ .restart
➤ .shutdown
➤ .setname
➤ .setstatus
➤ .setprefix
➤ .broadcast
➤ .block
➤ .unblock

━━━━━━━━━━━━━━━━━━━━━━━
🎮 FUN
━━━━━━━━━━━━━━━━━━━━━━━
➤ .truth
➤ .dare
➤ .joke
➤ .8ball
➤ .ship
➤ .meme

━━━━━━━━━━━━━━━━━━━━━━━
⚙️ SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━
➤ .stats
➤ .backup
➤ .update
➤ .plugins

━━━━━━━━━━━━━━━━━━━━━━━
💻 Powered By
🚀 EZED X TECH
🤖 EZED XMD
━━━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(from, {
            text: menu
        });

    }
};
