import Anthropic from '@anthropic-ai/sdk';
import config from '../config.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export async function askClaude(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const response = await client.messages.create({
    ...(systemPrompt && { system: systemPrompt }),
    model: config.anthropicModel,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error('No output text found in Claude response');
  }
  return textBlock.text;
}

export { client };
