import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

import { createPerplexityClient, PerplexityAPIError, PerplexityRateLimitError, PerplexityAuthError, GenerateContentParams } from '@/lib/perplexity'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, target_audience, format_type, tone, temperature } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

    if (!target_audience) {
      return NextResponse.json(
        { error: 'Target audience is required' },
        { status: 400 }
      )
    }

    const validFormats = [
      'hook-body-cta',
      'storytelling',
      'listicle',
      'how-to',
      'contrarian',
      'data-driven',
      'personal-story',
      'question-hook',
      'breaking-news',
      'thread'
    ]

    if (format_type && !validFormats.includes(format_type)) {
      return NextResponse.json(
        { error: `Invalid format type. Valid options: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    const validTones = [
      'professional',
      'casual',
      'humorous',
      'inspirational',
      'educational',
      'controversial',
      'empathetic',
      'authoritative'
    ]

    if (tone && !validTones.includes(tone)) {
      return NextResponse.json(
        { error: `Invalid tone. Valid options: ${validTones.join(', ')}` },
        { status: 400 }
      )
    }

    const params: GenerateContentParams = {
      topic,
      target_audience,
      format_type,
      tone,
      temperature: temperature || 0.7
    }

    const client = createPerplexityClient()
    const result = await client.generateContent(params)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Perplexity generate error:', error)

    if (error instanceof PerplexityRateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    if (error instanceof PerplexityAuthError) {
      return NextResponse.json(
        { error: 'Authentication failed. Check API key.' },
        { status: 401 }
      )
    }

    if (error instanceof PerplexityAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
