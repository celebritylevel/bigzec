/**
 * POST /api/agent/analyze/start
 *
 * Kicks off an Apify LinkedIn post scrape.
 * Returns a runId that the client polls against /api/agent/analyze/status
 */

import { NextRequest, NextResponse } from 'next/server'
import { startLinkedInScrape } from '@/lib/apify-linkedin'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body as { urls: string[] }

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Provide at least one LinkedIn post URL.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.APIFY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'APIFY_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    // Validate — only LinkedIn URLs
    const validUrls = urls.filter((url) => {
      try {
        return new URL(url).hostname.includes('linkedin.com')
      } catch {
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid LinkedIn URLs found. Make sure URLs contain linkedin.com.' },
        { status: 400 }
      )
    }

    const { runId, datasetId, actorId } = await startLinkedInScrape(validUrls, apiKey)

    return NextResponse.json({
      success: true,
      runId,
      datasetId,
      actorId,
      urlCount: validUrls.length,
      message: `Started scraping ${validUrls.length} post${validUrls.length !== 1 ? 's' : ''} using actor: ${actorId}`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to start scrape.' },
      { status: 500 }
    )
  }
}
