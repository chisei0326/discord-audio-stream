process.on("uncaughtException", err => console.log(err));

const { joinVoiceChannel, EndBehaviorType, createAudioPlayer, createAudioResource, StreamType, getVoiceConnection, getVoiceConnections, NoSubscriberBehavior, AudioReceiveStream } = require("@discordjs/voice");
const discord = require("discord.js");
const { leader_id } = require("./config");
const clients = require("./config").bots.map(d => { const client = new discord.Client(require("discordjs-allintents-v14")); client.login(d); return client });
const main_client = clients[0];
clients.shift();
if (clients.length > 25) return process.exit(console.error("botアカウントは25個までです。"));

main_client.once("ready", async () => {
    await main_client.application.commands.set(require("./commands"));
    console.log(`リーダーで利用するbot:${main_client.user.tag}`);
    let count = 1
    clients.forEach(d => { console.log(`bot${count}: ${d.user?.tag}`); count++ });
});

main_client.on("interactionCreate", async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === "join") {
            await interaction.deferReply();
            if (!leader_id.includes(interaction.user.id)) return interaction.followUp("この操作ができるのはリーダーのみです。config.jsの**leader_id**設定を見直してください。");
            const connect_vc_id = interaction.member.voice.channelId;
            const channels = interaction.options.data.map(d => d.channel);
            if (channels.map(d => d.id).includes(connect_vc_id)) return interaction.followUp("リーダー用チャンネルに入室させることはできません。");
            const users = clients.map(d => d.user.id);
            const main_connect = getVoiceConnection(interaction.guildId, "leader");
            const connections_ = users.map(d => getVoiceConnection(interaction.guildId, d));
            main_connect?.destroy();
            connections_.forEach(d => d?.destroy());
            const main_connection = joinVoiceChannel({ group: "leader", guildId: interaction.guildId, channelId: interaction.member.voice.channelId, adapterCreator: interaction.guild.voiceAdapterCreator, selfDeaf: false, selfMute: true });
            let count = 0;
            const connections = clients.map(d => {
                if (!channels[count]) return;
                const channel = d.channels.cache.get(channels[count].id);
                const guild = d.guilds.cache.get(channels[count].guildId);
                if (!channels[count]) return;
                if (!guild) return console.log(`${d.user.username}はサーバーへ参加していないため、接続できません。`);
                count++;
                return joinVoiceChannel({ group: guild.members.me.user.id, guildId: channel.guildId, channelId: channel.id, adapterCreator: channel.guild.voiceAdapterCreator });
            });
            main_connection.receiver.speaking.on("start", (userid) => {
                const speak_user = main_client.users.cache.get(userid);
                if (!leader_id.includes(userid)) return;
                const connection = getVoiceConnection(interaction.guildId, "leader");
                const audio = connection.receiver.subscribe(userid, { end: { duration: 500 } });
                const player = createAudioPlayer({ behaviors: NoSubscriberBehavior.Play });
                const resource = createAudioResource(audio, { inputType: StreamType.Opus });
                connections.forEach(d => { if (!d?.subscribe) return; d.subscribe(player) });
                player.play(resource);
            });
            interaction.followUp("接続しました。");
        } else if (interaction.commandName === "end") {
            await interaction.deferReply();
            if (!leader_id.includes(interaction.user.id)) return interaction.followUp("この操作ができるのはリーダーのみです。config.jsの**leader_id**設定を見直してください。");
            const users = clients.map(d => d.user.id);
            const main_connect = getVoiceConnection(interaction.guildId, "leader");
            const connections = users.map(d => getVoiceConnection(interaction.guildId, d));
            main_connect?.destroy();
            connections.forEach(d => d?.destroy());
            interaction.followUp("終了しました。");
        }
    }
});