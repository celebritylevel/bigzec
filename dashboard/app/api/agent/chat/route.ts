/**
 * POST /api/agent/chat
 *
 * Conversational endpoint for the LinkedIn/X Content Writer Agent.
 * Uses z-ai/glm-5 via OpenRouter, with Agent Skills injected as context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, type OpenRouterMessage } from '@/lib/openrouter'
import { buildSkillsSystemPrompt, DEFAULT_SKILLS, type AgentSkills } from '@/lib/agent-skills'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      messages,
      skills,
      platform,
    } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      skills?: AgentSkills
      platform?: 'linkedin' | 'twitter'
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'No messages provided.' }, { status: 400 })
    }

    const agentSkills = skills ?? DEFAULT_SKILLS
    const systemPrompt = buildSkillsSystemPrompt(agentSkills)

    const platformInstruction = platform
      ? `\n\nThe admin is currently focused on **${platform === 'linkedin' ? 'LinkedIn' : 'X (Twitter)'}** content. Optimize all generated posts for that platform.`
      : ''

    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt + platformInstruction },
      ...messages,
    ]

    const response = await chatCompletion(openRouterMessages, {
      temperature: 0.8,
      maxTokens: 2000,
    })

    return NextResponse.json({ success: true, message: response })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Chat request failed.' },
      { status: 500 }
    )
  }
}
