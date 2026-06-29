module.exports = {
    name: "setname",

    async execute({ sock, from, msg, args, config }) {

        const sender = msg.key.participant || msg.key.remoteJid;
        const owner = config.OWNER_NUMBER + "@s.whatsapp.net";

        if (sender !== owner) {
            return await sock.sendMessage(from, {
                text: "❌ This command is for the bot owner only."
            });
        }

        if (!args.length) {
            return await sock.sendMessage(from, {
                text: "Example:\n.setname EZED XMD"
            });
        }

        const name = args.join(" ");

        try {
            await sock.updateProfileName(name);

            await sock.sendMessage(from, {
                text: `✅ Bot name updated to:\n\n${name}`
            });
        } catch (err) {
            console.error(err);

            await sock.sendMessage(from, {
                text: "❌ Failed to update the bot name."
            });
        }
    }
};
