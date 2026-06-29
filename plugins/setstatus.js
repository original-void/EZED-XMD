module.exports = {
    name: "setstatus",

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
                text: "Example:\n.setstatus EZED XMD is Online 🚀"
            });
        }

        const status = args.join(" ");

        try {
            await sock.updateProfileStatus(status);

            await sock.sendMessage(from, {
                text: `✅ Bot status updated to:\n\n${status}`
            });
        } catch (err) {
            console.error(err);

            await sock.sendMessage(from, {
                text: "❌ Failed to update the bot status."
            });
        }
    }
};
