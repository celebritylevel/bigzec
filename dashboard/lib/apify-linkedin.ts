/**
 * Apify LinkedIn Post Scraper
 *
 * Uses apify/website-content-crawler to fetch LinkedIn post content.
 * This actor is universally available and works without LinkedIn cookies.
 */

const APIFY_BASE_URL = 'https://api.apify.com/v2'

// Primary actor - website-content-crawler is available on all Apify plans
const PRIMARY_ACTOR = 'apify/website-content-crawler'

// Fallback dedicated LinkedIn scrapers (require separate subscription)
const FALLBACK_ACTORS = [
  'curious_coder/linkedin-post-scraper',
  'pratikdani/linkedin-posts-scraper',
]

export interface ScrapedPost {
  url: string
  text: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  repostsCount?: number
  authorName?: string
  authorHeadline?: string
  publishedAt?: string
}

export interface ApifyRunResult {
  runId: string
  datasetId: string
  actorId: string
}

/**
 * Finds the best available LinkedIn scraper actor for this account.
 * Tries dedicated LinkedIn scrapers first; falls back to website-content-crawler.
 */
export async function findLinkedInActor(apiKey: string): Promise<string> {
  try {
    // Check which actors are rented/available on this account
    const res = await fetch(
      `${APIFY_BASE_URL}/store?token=${apiKey}&rented=true&limit=50`,
      { method: 'GET' }
    )
    if (res.ok) {
      const data = await res.json()
      const items: any[] = data.data?.items ?? []

      // Check if any dedicated LinkedIn post scraper is available
      for (const fallback of FALLBACK_ACTORS) {
        const [username, name] = fallback.split('/')
        const found = items.find(
          (a) => a.username === username && a.name === name
        )
        if (found) return fallback
      }
    }
  } catch {
    // Fall through to primary actor
  }

  return PRIMARY_ACTOR
}

/**
 * Builds the correct input payload for the given actor.
 */
function buildActorInput(actorId: string, postUrls: string[]): Record<string, unknown> {
  if (actorId === PRIMARY_ACTOR) {
    return {
      startUrls: postUrls.map((url) => ({ url })),
      maxCrawlDepth: 0,
      maxCrawlPages: postUrls.length,
      crawlerType: 'playwright:firefox',
      // LinkedIn requires JS rendering
      renderingTypeDetectionEnabled: false,
    }
  }

  // Dedicated LinkedIn scrapers
  return {
    startUrls: postUrls.map((url) => ({ url })),
    maxPosts: postUrls.length,
    proxyConfiguration: { useApifyProxy: true },
  }
}

/**
 * Starts an Apify LinkedIn post scraper run with the given URLs.
 * Returns the run ID and dataset ID for status polling.
 */
export async function startLinkedInScrape(
  postUrls: string[],
  apiKey: string
): Promise<ApifyRunResult> {
  const actorId = await findLinkedInActor(apiKey)
  const input = buildActorInput(actorId, postUrls)

  const res = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    let errorData: any = {}
    try { errorData = JSON.parse(errorText) } catch { /* raw text */ }

    // If actor is not rented, fall back to website-content-crawler
    if (errorData?.error?.type === 'actor-is-not-rented' && actorId !== PRIMARY_ACTOR) {
      return startWithPrimaryActor(postUrls, apiKey)
    }

    throw new Error(`Failed to start Apify run: ${res.status} — ${errorText}`)
  }

  const data = await res.json()
  return {
    runId: data.data.id,
    datasetId: data.data.defaultDatasetId,
    actorId,
  }
}

/**
 * Fallback: start a run using website-content-crawler directly.
 */
async function startWithPrimaryActor(
  postUrls: string[],
  apiKey: string
): Promise<ApifyRunResult> {
  const input = buildActorInput(PRIMARY_ACTOR, postUrls)

  const res = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(PRIMARY_ACTOR)}/runs?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to start Apify run with fallback actor: ${res.status} — ${error}`)
  }

  const data = await res.json()
  return {
    runId: data.data.id,
    datasetId: data.data.defaultDatasetId,
    actorId: PRIMARY_ACTOR,
  }
}

/**
 * Gets the current status of an Apify run.
 */
export async function getRunStatus(
  runId: string,
  apiKey: string
): Promise<{ status: string; datasetId: string }> {
  const res = await fetch(`${APIFY_BASE_URL}/actor-runs/${runId}?token=${apiKey}`)
  if (!res.ok) throw new Error(`Failed to get run status: ${res.status}`)
  const data = await res.json()
  return {
    status: data.data.status,
    datasetId: data.data.defaultDatasetId,
  }
}

/**
 * Normalizes a raw dataset item from any actor into ScrapedPost format.
 * Handles both dedicated LinkedIn scrapers and website-content-crawler output.
 */
function normalizeItem(item: any): ScrapedPost {
  // website-content-crawler format: {url, text, markdown, metadata, ...}
  const text = item.text || item.markdown || item.content || item.postText || ''
  return {
    url: item.url || item.postUrl || '',
    text: text.trim(),
    likesCount: item.likesCount ?? item.numLikes ?? 0,
    commentsCount: item.commentsCount ?? item.numComments ?? 0,
    sharesCount: item.sharesCount ?? item.numShares ?? item.repostsCount ?? 0,
    authorName: item.authorName ?? item.author ?? item.metadata?.author ?? '',
    authorHeadline: item.authorHeadline ?? '',
    publishedAt: item.publishedAt ?? item.createdAt ?? '',
  }
}

/**
 * Retrieves scraped items from an Apify dataset and normalizes them.
 */
export async function getDatasetItems(
  datasetId: string,
  apiKey: string
): Promise<ScrapedPost[]> {
  const res = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${apiKey}&clean=true&limit=50`
  )
  if (!res.ok) throw new Error(`Failed to get dataset items: ${res.status}`)
  const data = await res.json()
  const items: any[] = Array.isArray(data) ? data : []
  return items.map(normalizeItem).filter((p) => p.text.length > 20)
}
