import { Client, GatewayIntentBits } from 'discord.js';

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
        const prompt = message.content.slice(5).trim();
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
                    "model": "mistralai/mistral-small-3.2-24b-instruct:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                }
                            ]
                        }
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
            message.reply(reply.slice(0, 2000));
        } catch (err) {
            console.error('🔥 Errore durante la fetch:', err);
            message.reply('⚠️ Errore durante la richiesta all’LLM.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);