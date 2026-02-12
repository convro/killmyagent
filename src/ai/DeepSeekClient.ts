import OpenAI from 'openai';
import { AGENT_TIMEOUT_MS } from '@/utils/constants';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

export interface DeepSeekResponse {
  reasoning: string;
  content: string;
}

export async function callDeepSeekR1(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.9,
): Promise<DeepSeekResponse> {
  try {
    const response = await Promise.race([
      client.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        stream: false,
      } as never),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Agent timeout')), AGENT_TIMEOUT_MS)
      ),
    ]);

    const message = (response as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reasoning = (message as any)?.reasoning_content || '';
    const content = message?.content || '';

    return { reasoning, content };
  } catch (error) {
    console.error('DeepSeek API error:', error);
    return {
      reasoning: 'Error connecting to reasoning engine. Falling back to survival instinct.',
      content: '{"action": "hide"}',
    };
  }
}

export async function callDeepSeekR1Streaming(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.9,
  onReasoningChunk?: (chunk: string) => void,
  onContentChunk?: (chunk: string) => void,
): Promise<DeepSeekResponse> {
  try {
    const stream = await client.chat.completions.create({
      model: 'deepseek-reasoner',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      stream: true,
    } as never);

    let reasoning = '';
    let content = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of stream as any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delta = (chunk as any).choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.reasoning_content) {
        reasoning += delta.reasoning_content;
        onReasoningChunk?.(delta.reasoning_content);
      }
      if (delta.content) {
        content += delta.content;
        onContentChunk?.(delta.content);
      }
    }

    return { reasoning, content };
  } catch (error) {
    console.error('DeepSeek streaming error:', error);
    return {
      reasoning: 'Error connecting to reasoning engine. Falling back to survival instinct.',
      content: '{"action": "hide"}',
    };
  }
}
