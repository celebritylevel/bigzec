/**
 * Formats API Route
 * 
 * Handles CRUD operations for format patterns:
 * - GET: List all stored formats
 * - POST: Save a new format pattern
 * - DELETE: Remove multiple formats (bulk delete)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

import {
  getStoredFormats,
  learnFromPost,
  batchLearn,
  clearFormats,
  getFormatStats
} from '@/lib/format-learner'
import { ViralPost, FormatPattern, Platform } from '@/lib/types/social-media'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') as Platform | null
    const stats = searchParams.get('stats') === 'true'
    
    if (stats) {
      const formatStats = getFormatStats(platform || undefined)
      return NextResponse.json({
        success: true,
        data: formatStats
      })
    }
    
    const formats = getStoredFormats(platform || undefined)
    
    return NextResponse.json({
      success: true,
      data: formats,
      count: formats.length
    })
  } catch (error) {
    console.error('Error fetching formats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch formats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.formats && Array.isArray(body.formats)) {
      const formats = body.formats as FormatPattern[]
      const results = formats.map(format => {
        const viralPost: ViralPost = {
          id: format.id,
          platform: format.platform,
          content: format.examplePost || format.template,
          metrics: {
            likes: 0,
            comments: 0,
            shares: 0,
            engagementRate: format.effectivenessScore
          },
          createdAt: format.createdAt
        }
        return learnFromPost(viralPost)
      })
      
      return NextResponse.json({
        success: true,
        data: results,
        message: `Imported ${results.length} formats`
      })
    }
    
    if (body.post) {
      const post = body.post as ViralPost
      const format = learnFromPost(post)
      
      return NextResponse.json({
        success: true,
        data: format,
        message: 'Format learned and stored successfully'
      })
    }
    
    if (body.format) {
      const formatData = body.format as Partial<FormatPattern>
      
      if (!formatData.platform || !formatData.hookType || !formatData.bodyType) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: platform, hookType, bodyType' },
          { status: 400 }
        )
      }
      
      const viralPost: ViralPost = {
        id: `manual-${Date.now()}`,
        platform: formatData.platform,
        content: formatData.examplePost || formatData.template || '',
        metrics: {
          likes: 0,
          comments: 0,
          shares: 0,
          engagementRate: formatData.effectivenessScore || 50
        },
        createdAt: new Date().toISOString()
      }
      
      const format = learnFromPost(viralPost)
      
      return NextResponse.json({
        success: true,
        data: format,
        message: 'Format created successfully'
      })
    }
    
    if (body.posts && Array.isArray(body.posts)) {
      const posts = body.posts as ViralPost[]
      const results = batchLearn(posts)
      
      return NextResponse.json({
        success: true,
        data: results,
        message: `Learned from ${results.length} posts`
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid request body. Provide "post", "posts", "format", or "formats"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing format:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process format' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'
    const ids = searchParams.get('ids')
    
    if (all) {
      clearFormats()
      return NextResponse.json({
        success: true,
        message: 'All formats cleared'
      })
    }
    
    if (ids) {
      const formatIds = ids.split(',').map(id => id.trim())
      const { deleteFormat } = await import('@/lib/format-learner')
      const deleted = formatIds.filter(id => deleteFormat(id))
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${deleted.length} formats`,
        deletedIds: deleted
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Provide "all=true" or "ids" parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error deleting formats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete formats' },
      { status: 500 }
    )
  }
}