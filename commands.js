const discord = require("discord.js");
const scb = discord.SlashCommandBuilder;
const bots = require("./config").bots; delete bots[0];

const join = new scb()
    .setName("join")
    .setDescription("botを参加させます。")
let count = 1;
bots.map(d => {
    join.addChannelOption(o => o
        .setName(`bot${count}`)
        .setDescription(`bot${count}を参加させるチャンネル`)
        .addChannelTypes(discord.ChannelType.GuildVoice));
    count++;
});

module.exports = [
    join,
    new scb()
        .setName("end")
        .setDescription("切断します。")
];