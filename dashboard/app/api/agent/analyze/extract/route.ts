/**
 * POST /api/agent/analyze/extract
 *
 * Takes scraped LinkedIn posts and runs them through z-ai/glm-5 via OpenRouter.
 * Returns structured ContentFormat[] — the learned format patterns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openrouter'
import type { ScrapedPost } from '@/lib/apify-linkedin'

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are an expert content strategist and format analyst. Your job is to reverse-engineer why LinkedIn posts perform well by identifying their structural patterns.

Analyze the provided LinkedIn posts and extract reusable format patterns. For each DISTINCT format pattern you find (not each post — consolidate similar formats), return a structured JSON object.

Format pattern fields:
- id: kebab-case slug (e.g. "story-lesson-cta", "bold-listicle-save")
- name: Short, descriptive name (e.g. "Failure Story → Lesson", "Bold Claim Listicle")
- description: 1-2 sentences on when to use this format
- hookType: One of: QUESTION | BOLD_STATEMENT | PERSONAL_STORY | COUNTERINTUITIVE_TAKE | STATISTIC | HOW_TO | CONTROVERSIAL | LIST_PREVIEW | FAILURE_ADMISSION
- bodyStructure: One of: NUMBERED_LIST | STORY_ARC | PROBLEM_SOLUTION | INSIGHT_DUMP | STEP_BY_STEP | COMPARISON | MYTH_BUSTING | LESSON_LEARNED | BEFORE_AFTER
- ctaType: One of: COMMENT_PROMPT | SAVE_FOR_LATER | FOLLOW_FOR_MORE | SHARE | SOFT_SELL | NO_CTA | AGREE_DISAGREE
- template: A fill-in-the-blank template using [PLACEHOLDERS] — include the exact structure with line breaks
- example: First 300 characters of the most representative post using this format
- platform: "linkedin" | "twitter" | "both"
- effectivenessIndicators: Array of 2-4 strings explaining WHY this format works (psychological triggers, format benefits)
- sourcePosts: Array of the source post URLs

Return ONLY a valid JSON array. No markdown, no explanation. Just the JSON array.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { posts } = body as { posts: (ScrapedPost & { url?: string })[] }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ success: false, error: 'No posts provided.' }, { status: 400 })
    }

    // Build the posts context for the model
    const postsContext = posts
      .filter((p) => p.text && p.text.trim().length > 20)
      .map(
        (p, i) => `--- Post ${i + 1} ---
URL: ${p.url ?? 'unknown'}
Engagement: ${p.likesCount ?? 0} likes · ${p.commentsCount ?? 0} comments · ${p.sharesCount ?? 0} reposts
Author: ${p.authorName ?? 'unknown'} ${p.authorHeadline ? `· ${p.authorHeadline}` : ''}

Content:
${p.text.trim()}
`
      )
      .join('\n')

    if (!postsContext) {
      return NextResponse.json(
        { success: false, error: 'No usable post content found in scraped data.' },
        { status: 400 }
      )
    }

    const rawResult = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze these ${posts.length} LinkedIn posts and extract the distinct format patterns:\n\n${postsContext}`,
        },
      ],
      { temperature: 0.2, maxTokens: 4000 }
    )

    // Parse JSON from the response (handle code block wrapping and truncation)
    let formats: any[] = []
    let rawAnalysis = ''

    try {
      let jsonStr = rawResult
      // Extract JSON array if wrapped in code blocks
      const codeBlockMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      }
      // Find the array
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        let arrayStr = jsonMatch[0]
        // Handle truncated JSON - try to close incomplete objects
        if (!arrayStr.trim().endsWith(']')) {
          // Count unclosed braces/brackets
          let openBraces = 0
          let openBrackets = 0
          let inString = false
          let escape = false
          for (const char of arrayStr) {
            if (escape) { escape = false; continue }
            if (char === '\\') { escape = true; continue }
            if (char === '"') { inString = !inString; continue }
            if (!inString) {
              if (char === '{') openBraces++
              if (char === '}') openBraces--
              if (char === '[') openBrackets++
              if (char === ']') openBrackets--
            }
          }
          // Close any unclosed strings
          if (inString) arrayStr += '"'
          // Close unclosed objects and arrays
          while (openBraces > 0) { arrayStr += '}'; openBraces-- }
          while (openBrackets > 0) { arrayStr += ']'; openBrackets-- }
        }
        formats = JSON.parse(arrayStr)
      } else {
        rawAnalysis = rawResult
      }
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr)
      rawAnalysis = rawResult
    }

    // Enrich with timestamps
    const enriched = formats.map((f) => ({
      ...f,
      id: f.id || `format-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      formats: enriched,
      rawAnalysis: rawAnalysis || null,
      count: enriched.length,
      message: enriched.length > 0
        ? `Extracted ${enriched.length} format pattern${enriched.length !== 1 ? 's' : ''}`
        : 'Analysis complete — see raw output',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Format extraction failed.' },
      { status: 500 }
    )
  }
}
