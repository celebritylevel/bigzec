import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

import {
  generatePost,
  validateContent,
  optimizeForPlatform,
  addViralElements,
  Platform,
  Tone,
  GeneratedContent
} from '../../../../lib/content-generator';
import { 
  hookTemplates, 
  HookType, 
  getHookByType 
} from '../../../../lib/hooks-library';
import { 
  ctaTemplates, 
  CTAType, 
  getCTAByType 
} from '../../../../lib/cta-library';

interface GenerateRequest {
  topic: string;
  platform: 'linkedin' | 'twitter';
  format_id?: string;
  tone?: 'professional' | 'casual' | 'bold';
  target_audience?: string;
  hook_type?: HookType;
  cta_type?: CTAType;
  key_points?: string[];
  max_length?: number;
  include_emojis?: boolean;
  include_hashtags?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    
    const { topic, platform } = body;
    
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!platform || !['linkedin', 'twitter'].includes(platform)) {
      return NextResponse.json(
        { error: 'Platform must be either "linkedin" or "twitter"' },
        { status: 400 }
      );
    }
    
    if (body.hook_type && !hookTemplates[body.hook_type]) {
      return NextResponse.json(
        { error: `Invalid hook_type. Valid types: ${Object.keys(hookTemplates).join(', ')}` },
        { status: 400 }
      );
    }
    
    if (body.cta_type && !ctaTemplates[body.cta_type]) {
      return NextResponse.json(
        { error: `Invalid cta_type. Valid types: ${Object.keys(ctaTemplates).join(', ')}` },
        { status: 400 }
      );
    }
    
    const generated = generatePost({
      topic,
      platform: platform as Platform,
      formatId: body.format_id,
      tone: body.tone as Tone,
      targetAudience: body.target_audience,
      hookType: body.hook_type,
      ctaType: body.cta_type,
      keyPoints: body.key_points,
      maxLength: body.max_length,
      includeEmojis: body.include_emojis ?? true,
      includeHashtags: body.include_hashtags ?? true
    });
    
    const enhanced = addViralElements(generated.content, platform as Platform);
    const optimized = optimizeForPlatform(enhanced, platform as Platform);
    const validation = validateContent(optimized, platform as Platform);
    
    const response: GeneratedContent & {
      validation: typeof validation;
      metadata: {
        generated_at: string;
        platform: string;
        topic: string;
        tone: string;
      };
    } = {
      ...generated,
      content: optimized,
      validation,
      metadata: {
        generated_at: new Date().toISOString(),
        platform,
        topic,
        tone: body.tone || 'professional'
      }
    };
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const hookTypes = Object.keys(hookTemplates) as HookType[];
  const ctaTypes = Object.keys(ctaTemplates) as CTAType[];
  
  return NextResponse.json({
    success: true,
    data: {
      available_hooks: hookTypes.map(type => ({
        type,
        template: hookTemplates[type].template,
        examples: hookTemplates[type].examples,
        emotion_trigger: hookTemplates[type].emotionTrigger
      })),
      available_ctas: ctaTypes.map(type => ({
        type,
        template: ctaTemplates[type].template,
        examples: ctaTemplates[type].examples,
        engagement_level: ctaTemplates[type].engagementLevel
      })),
      available_tones: ['professional', 'casual', 'bold'],
      available_platforms: ['linkedin', 'twitter'],
      platform_limits: {
        linkedin: { min: 100, optimal: 1500, max: 3000 },
        twitter: { min: 20, optimal: 240, max: 280 }
      }
    }
  });
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoints: {
      'POST /api/content/generate': {
        description: 'Generate social media content',
        parameters: {
          topic: { type: 'string', required: true, description: 'The main topic for the content' },
          platform: { type: 'string', required: true, enum: ['linkedin', 'twitter'] },
          format_id: { type: 'string', required: false, description: 'ID of a learned format to apply' },
          tone: { type: 'string', required: false, enum: ['professional', 'casual', 'bold'], default: 'professional' },
          target_audience: { type: 'string', required: false, description: 'Target audience description' },
          hook_type: { type: 'string', required: false, enum: ['question', 'bold_statement', 'story', 'listicle', 'controversial', 'how_to', 'myth_buster', 'counterintuitive'] },
          cta_type: { type: 'string', required: false, enum: ['question', 'engagement', 'link', 'save', 'follow', 'share', 'comment', 'debate'] },
          key_points: { type: 'string[]', required: false, description: 'Key points to include in the content' },
          max_length: { type: 'number', required: false, description: 'Maximum character length' },
          include_emojis: { type: 'boolean', required: false, default: true },
          include_hashtags: { type: 'boolean', required: false, default: true }
        },
        response: {
          content: 'string - The generated content',
          hook: 'string - The hook used',
          cta: 'string - The CTA used',
          characterCount: 'number',
          wordCount: 'number',
          hashtags: 'string[]',
          viralScore: 'number (0-100)',
          suggestions: 'string[]',
          isThread: 'boolean (for Twitter)',
          threadContent: 'string[] | null',
          validation: { isValid: 'boolean', errors: 'string[]', warnings: 'string[]', score: 'number' }
        }
      },
      'GET /api/content/generate': {
        description: 'Get available options for content generation',
        response: {
          available_hooks: 'array of hook templates',
          available_ctas: 'array of CTA templates',
          available_tones: 'string[]',
          available_platforms: 'string[]',
          platform_limits: 'object with min/optimal/max for each platform'
        }
      }
    }
  });
}
