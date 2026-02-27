/**
 * GET /api/agent/analyze/status?runId=xxx
 *
 * Polls the Apify run status.
 * Returns posts when the run has SUCCEEDED.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRunStatus, getDatasetItems } from '@/lib/apify-linkedin'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')

    if (!runId) {
      return NextResponse.json({ success: false, error: 'runId is required.' }, { status: 400 })
    }

    const apiKey = process.env.APIFY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'APIFY_API_KEY is not configured.' }, { status: 500 })
    }

    const { status, datasetId } = await getRunStatus(runId, apiKey)

    if (status === 'SUCCEEDED') {
      const posts = await getDatasetItems(datasetId, apiKey)
      return NextResponse.json({
        success: true,
        status,
        posts,
        postCount: posts.length,
      })
    }

    if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(status)) {
      return NextResponse.json({
        success: false,
        status,
        error: `Apify run ${status.toLowerCase()}. Try again.`,
      })
    }

    // Still RUNNING or READY
    return NextResponse.json({
      success: true,
      status,
      message: 'Scraping in progress...',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get run status.' },
      { status: 500 }
    )
  }
}
