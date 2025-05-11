import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://postpilot.app",
    "X-Title": "PostPilot",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
    }
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-prover-v2:free",
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes engaging LinkedIn posts.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });
    const post = completion.choices[0]?.message?.content?.trim() || '';
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate post.' }, { status: 500 });
  }
} 