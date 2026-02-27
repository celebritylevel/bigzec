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

    const isLinkedIn = url.includes('linkedin.com')
    const isTwitter = url.includes('twitter.com') || url.includes('x.com')
    
    if (!isLinkedIn && !isTwitter) {
      return NextResponse.json(
        { error: 'URL must be from LinkedIn or Twitter/X' },
        { status: 400 }
      )
    }

    const client = createPerplexityClient()
    const analysis = await client.analyzePost(url)

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Perplexity analyze error:', error)

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
      { error: 'Failed to analyze post' },
      { status: 500 }
    )
  }
}
