import { Client, GatewayIntentBits } from 'discord.js';
import { OpenAI } from 'openai';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

client.once('ready', () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!ai ')) {
        const prompt = message.content.slice(4).trim();
        if (!prompt) return message.reply("Scrivi qualcosa dopo `!ai`!");

        message.channel.sendTyping();

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                max_tokens: 1000,
                messages: [
                    { role: 'system', content: 'Rispondi in modo breve e utile.' },
                    { role: 'user', content: prompt }
                ]
            });

            const reply = completion.choices[0].message.content;
            const chunks = reply.match(/[\s\S]{1,1990}(?!\S)/g) || [];

            for (const chunk of chunks) {
                await message.reply(chunk);
            }

        } catch (err) {
            console.error('🔥 Errore OpenAI:', err);
            message.reply('⚠️ Errore durante la richiesta a OpenAI.');
        }
    }
});

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('BruschettaBot is alive!\n');
}).listen(PORT, () => {
    console.log(`🛰️ HTTP server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);