import { Client, GatewayIntentBits } from 'discord.js';
import http from 'http';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!ai ')) {
        const prompt = message.content.slice(2).trim();
        if (!prompt) return message.reply("Scrivi qualcosa dopo `!ai`!");

        message.channel.sendTyping();

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/LucaOr12/BruschetteAi',
                    'X-Title': 'BruschetteAiBot'
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
                    max_tokens: 1000,
                    messages: [
                        { role: 'system', content: 'Rispondi in modo breve e utile' },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            const status = response.status;
            const data = await response.json();

            console.log(`🔄 Status: ${status}`);
            console.log('📦 Risposta JSON:', JSON.stringify(data, null, 2));

            if (!data.choices || !data.choices[0]) {
                message.reply("❌ Nessuna scelta valida ricevuta.");
                return;
            }

            const reply = data.choices[0].message.content;
            const chunks = reply.match(/[\s\S]{1,1990}(?!\S)/g);

            for (const chunk of chunks) {
                await message.reply(chunk);
            }

        } catch (err) {
            console.error('🔥 Errore durante la fetch:', err);
            message.reply('⚠️ Errore durante la richiesta all’LLM.');
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