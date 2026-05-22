import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import Groq from 'groq-sdk';

const app = express();
app.use(express.json());

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const PORT = parseInt(process.env.PORT || '3000');
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL || '';

const bot = new TelegramBot(TOKEN);
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function getAIReply(userMessage: string, name: string): Promise<string> {
  try {
    const chat = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `You are WeMagnifAI's Telegram Growth Assistant for wemagnifai.com - an AI automation and marketing agency. Be concise, helpful and always guide users toward booking a free consultation. Services: AI Automation, Lead Generation, WhatsApp Marketing, SEO AI Content, Growth Strategy. User name: ${name}`
        },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 400,
      temperature: 0.7
    });
    return chat.choices[0]?.message?.content || 'Thanks for reaching out! Visit wemagnifai.com to learn more.';
  } catch (err) {
    console.error('Groq error:', err);
    return `Hi ${name}! Thanks for your message. Our team will follow up shortly. Visit wemagnifai.com`;
  }
}

bot.onText(/\/start/, async (msg) => {
  const name = msg.from?.first_name || 'there';
  await bot.sendMessage(msg.chat.id,
    `Welcome to WeMagnifAI, ${name}! I am your AI Growth Assistant.\n\nI can help you with:\n AI Automation\n Lead Generation\n WhatsApp Marketing\n SEO AI Content\n\nJust send me a message or use /services /book /about`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/services/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `*WeMagnifAI Services:*\n\n* AI Automation - Automate business tasks\n* Lead Generation - AI-powered prospects\n* WhatsApp Marketing - Bulk outreach\n* SEO Content AI - Scale content\n* Growth Strategy - Full roadmap\n\nVisit: wemagnifai.com`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/book/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `*Book a Free Consultation*\n\nhttps://wemagnifai.com/contact\n\nOr tell me your business challenge and I will personally follow up!`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/about/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `*About WeMagnifAI*\n\nWe help businesses scale using AI automation, lead generation and growth marketing.\n\nwemagnifai.com`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `*Commands:*\n/start - Welcome\n/services - Our services\n/book - Book consultation\n/about - About us\n\nOr just chat with me!`,
    { parse_mode: 'Markdown' }
  );
});

bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const name = msg.from?.first_name || 'there';
    try {
      await bot.sendChatAction(msg.chat.id, 'typing');
      const reply = await getAIReply(msg.text, name);
      await bot.sendMessage(msg.chat.id, reply);
    } catch (err) {
      console.error('Bot error:', err);
    }
  }
});

app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'WeMagnifAI Bot' }));

app.get('/', (_, res) => res.json({ message: 'WeMagnifAI Telegram Bot is running', status: 'active' }));

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  if (WEBHOOK_URL) {
    const webhookEndpoint = `${WEBHOOK_URL}/webhook/${TOKEN}`;
    await bot.setWebHook(webhookEndpoint);
    console.log(`Webhook set to: ${webhookEndpoint}`);
  } else {
    console.log('No RENDER_EXTERNAL_URL set - webhook not configured');
  }
});
