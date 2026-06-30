const config = require("../config");

module.exports = {

    name: "owner",

    async execute({ sock, from }) {

        await sock.sendMessage(from, {

            text:
`👑 BOT OWNER

Name : ${config.OWNER_NAME}

Phone : ${config.OWNER_NUMBER}`

        });

    }

};
