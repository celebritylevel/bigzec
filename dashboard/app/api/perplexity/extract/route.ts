import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

import { createPerplexityClient, PerplexityAPIError, PerplexityRateLimitError, PerplexityAuthError } from '@/lib/perplexity'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    if (!urlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const client = createPerplexityClient()
    const result = await client.extractContent(url)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Perplexity extract error:', error)

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
      { error: 'Failed to extract content' },
      { status: 500 }
    )
  }
}
