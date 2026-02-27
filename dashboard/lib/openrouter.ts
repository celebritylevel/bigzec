/**
 * OpenRouter API Client
 * Default model: z-ai/glm-5
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export const DEFAULT_MODEL = 'z-ai/glm-5'

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterChoice {
  message: { role: string; content: string }
  finish_reason: string
}

interface OpenRouterResponse {
  id: string
  choices: OpenRouterChoice[]
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

export async function chatCompletion(
  messages: OpenRouterMessage[],
  options?: {
    model?: string
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY is not configured. Add it to your .env.local file.')
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bigzec.com',
      'X-Title': 'BigZEC GTM Dashboard',
    },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}
