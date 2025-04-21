require('dotenv').config();
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { BASE_PROMPT, getSystemPrompt } from './prompts';
import { basePrompt as nodeBasePrompt } from './defaults/node';
import { basePrompt as reactBasePrompt } from './defaults/react';

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192'; // or 'mixtral-8x7b-32768'

async function callGroq(messages: any[], max_tokens: number) {
  const res = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: max_tokens,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content;
}

app.post('/template', async (req, res) => {
  const prompt = req.body.prompt;

  const messages = [
    {
      role: 'system',
      content:
        "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const answer = (await callGroq(messages, 200)).trim().toLowerCase();

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

app.post('/chat', async (req, res) => {
  const userMessages = req.body.messages;

  const messages = [
    {
      role: 'system',
      content: getSystemPrompt(),
    },
    ...userMessages,
  ];

  const output = await callGroq(messages, 8000);
  console.log('Output:', output);
  res.json({
    response: output,
  });
});
app.listen(3000, () => {
  console.log('Groq server running on http://localhost:3000');
});
