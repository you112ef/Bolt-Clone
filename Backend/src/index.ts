require('dotenv').config();
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BASE_PROMPT, getSystemPrompt } from './prompts';
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { basePrompt as reactBasePrompt } from './defaults/react';

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-Requested-With', 'Content-Type', 'Accept']
}));
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = 'gemini-2.0-flash';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function callGemini(messages: any[], maxTokens: number) {
  const model = genAI.getGenerativeModel({ model: MODEL });

  const chat = model.startChat({
    history: messages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
  });

  const userMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
}

// Detect if project is node or react
app.post('/template', async (req, res) => {
  const prompt = req.body.prompt;

  const messages = [
    {
      role: 'user',
      content:
        "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra\n\n" + prompt,
    },
  ];

  const answer = (await callGemini(messages, 200)).trim().toLowerCase();

  if (answer === 'react') {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n `,
      ],
      uiPrompts: [reactBasePrompt],
    });
  } else if (answer === 'node') {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [nodeBasePrompt],
    });
  } else {
    res.status(403).json({ message: "You can't access this" });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  const userMessages = req.body.messages;

  const messages = [
    {
      role: 'user',
      content: `${getSystemPrompt()}\n\n` + userMessages.map((m: any) => m.content).join('\n'),
    },
  ];

  const output = await callGemini(messages, 8000);
  console.log('Output:', output);
  res.json({
    response: output,
  });
});

// Handle preflight requests
app.options('*', cors());

// Handle root path for health checks
app.get('/', (req, res) => {
  res.status(200).send('Bolt Backend API is running');
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Gemini server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless function
export default app;
