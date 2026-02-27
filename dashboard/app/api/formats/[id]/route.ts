/**
 * Single Format API Route
 * 
 * Handles operations on individual format patterns:
 * - GET: Retrieve a specific format by ID
 * - PUT: Update a format pattern
 * - DELETE: Remove a format pattern
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

import {
  getFormatById,
  updateFormat,
  deleteFormat,
  getLearningData
} from '@/lib/format-learner'
import { FormatPattern } from '@/lib/types/social-media'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeLearning = searchParams.get('learning') === 'true'
    
    const format = getFormatById(id)
    
    if (!format) {
      return NextResponse.json(
        { success: false, error: 'Format not found' },
        { status: 404 }
      )
    }
    
    if (includeLearning) {
      const learningData = getLearningData(id)
      return NextResponse.json({
        success: true,
        data: {
          format,
          learning: learningData
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: format
    })
  } catch (error) {
    console.error('Error fetching format:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch format' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingFormat = getFormatById(id)
    if (!existingFormat) {
      return NextResponse.json(
        { success: false, error: 'Format not found' },
        { status: 404 }
      )
    }
    
    const updates: Partial<Omit<FormatPattern, 'id' | 'createdAt'>> = {}
    
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.template !== undefined) updates.template = body.template
    if (body.examplePost !== undefined) updates.examplePost = body.examplePost
    if (body.tags !== undefined) updates.tags = body.tags
    if (body.effectivenessScore !== undefined) {
      updates.effectivenessScore = Math.max(0, Math.min(100, body.effectivenessScore))
    }
    if (body.hookType !== undefined) updates.hookType = body.hookType
    if (body.bodyType !== undefined) updates.bodyType = body.bodyType
    if (body.ctaType !== undefined) updates.ctaType = body.ctaType
    
    const updatedFormat = updateFormat(id, updates)
    
    return NextResponse.json({
      success: true,
      data: updatedFormat,
      message: 'Format updated successfully'
    })
  } catch (error) {
    console.error('Error updating format:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update format' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const existingFormat = getFormatById(id)
    if (!existingFormat) {
      return NextResponse.json(
        { success: false, error: 'Format not found' },
        { status: 404 }
      )
    }
    
    const deleted = deleteFormat(id)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete format' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Format deleted successfully',
      deletedId: id
    })
  } catch (error) {
    console.error('Error deleting format:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete format' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const existingFormat = getFormatById(id)
    if (!existingFormat) {
      return NextResponse.json(
        { success: false, error: 'Format not found' },
        { status: 404 }
      )
    }
    
    if (body.incrementUsage) {
      const updatedFormat = updateFormat(id, {
        usageCount: existingFormat.usageCount + 1
      })
      
      return NextResponse.json({
        success: true,
        data: updatedFormat,
        message: 'Usage count incremented'
      })
    }
    
    if (body.updateScore !== undefined) {
      const newScore = (existingFormat.effectivenessScore + body.updateScore) / 2
      const updatedFormat = updateFormat(id, {
        effectivenessScore: Math.round(newScore)
      })
      
      return NextResponse.json({
        success: true,
        data: updatedFormat,
        message: 'Effectiveness score updated'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid PATCH operation. Use "incrementUsage" or "updateScore"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error patching format:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to patch format' },
      { status: 500 }
    )
  }
}