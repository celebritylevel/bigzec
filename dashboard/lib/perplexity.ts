const PERPLEXITY_API_URL = 'https://api.perplexity.ai'

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  return_citations?: boolean
  search_domain_filter?: string[]
}

export interface PerplexityResponse {
  id: string
  model: string
  object: string
  created: number
  citations?: string[]
  choices: {
    index: number
    finish_reason: string
    message: PerplexityMessage
    delta?: {
      role: string
      content: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface PerplexityError {
  error: {
    message: string
    type: string
    code: string
  }
}

export type PerplexityModel = 'sonar' | 'llama-3.1-sonar-small-128k-online' | 'llama-3.1-sonar-large-128k-online'

export class PerplexityClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || ''
    this.baseUrl = PERPLEXITY_API_URL

    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required')
    }
  }

  async chat(request: PerplexityRequest): Promise<PerplexityResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as PerplexityError
      const errorMessage = errorData.error?.message || `Perplexity API error: ${response.status}`
      
      if (response.status === 429) {
        throw new PerplexityRateLimitError(errorMessage)
      }
      
      if (response.status === 401) {
        throw new PerplexityAuthError(errorMessage)
      }
      
      throw new PerplexityAPIError(errorMessage, response.status)
    }

    return response.json()
  }

  async analyzePost(url: string): Promise<AnalyzePostResponse> {
    const systemPrompt = `You are an expert social media analyst. Your task is to analyze viral social media posts and extract structured insights.

When analyzing a post, identify:
1. The platform (LinkedIn or Twitter/X)
2. The exact content of the post
3. The format pattern used (e.g., hook-body-CTA, storytelling, listicle, etc.)
4. Engagement signals that make it viral (emotional triggers, formatting, timing signals, etc.)
5. Estimated metrics if visible or inferable
6. Key elements like emojis, hashtags, mentions, and structural choices

Return your analysis as valid JSON only, no markdown formatting.`

    const userPrompt = `Analyze this social media post URL and provide a detailed breakdown:

URL: ${url}

Return your response as a JSON object with this exact structure:
{
  "platform": "linkedin" | "twitter",
  "content": "the full post text",
  "format_pattern": {
    "type": "pattern name",
    "description": "brief description of the pattern",
    "components": ["array of components like hook", "body", "cta"]
  },
  "engagement_signals": {
    "emotional_triggers": ["array of triggers"],
    "formatting_choices": ["array of formatting elements"],
    "timing_indicators": ["any timing-related signals"],
    "credibility_markers": ["any authority or credibility signals"]
  },
  "estimated_metrics": {
    "likes": number or null,
    "comments": number or null,
    "shares": number or null,
    "views": number or null
  },
  "key_elements": {
    "emojis": ["array of emojis used"],
    "hashtags": ["array of hashtags"],
    "mentions": ["array of mentions"],
    "links": ["array of links"],
    "structure": "description of the structural choices",
    "word_count": number,
    "has_hook": boolean,
    "has_cta": boolean
  }
}`

    const response = await this.chat({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      return JSON.parse(content) as AnalyzePostResponse
    } catch {
      return {
        platform: 'unknown',
        content: content,
        format_pattern: {
          type: 'unknown',
          description: 'Could not parse format pattern',
          components: []
        },
        engagement_signals: {
          emotional_triggers: [],
          formatting_choices: [],
          timing_indicators: [],
          credibility_markers: []
        },
        estimated_metrics: {
          likes: null,
          comments: null,
          shares: null,
          views: null
        },
        key_elements: {
          emojis: [],
          hashtags: [],
          mentions: [],
          links: [],
          structure: 'unknown',
          word_count: 0,
          has_hook: false,
          has_cta: false
        },
        raw_response: content
      }
    }
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResponse> {
    const systemPrompt = `You are an expert social media content creator. Your task is to generate high-performing social media posts based on proven viral formats.

When generating content:
1. Follow proven viral post structures
2. Include strong hooks that capture attention
3. Use appropriate formatting for readability
4. Add clear CTAs when appropriate
5. Match the requested tone and audience

Return your response as valid JSON only, no markdown formatting.`

    const userPrompt = `Generate a social media post with the following parameters:

Topic: ${params.topic}
Target Audience: ${params.target_audience}
${params.format_type ? `Format Type: ${params.format_type}` : ''}
${params.tone ? `Tone: ${params.tone}` : ''}

Return your response as a JSON object with this exact structure:
{
  "generated_post": "the full post text with proper formatting",
  "format_used": {
    "name": "name of the format used",
    "description": "why this format was chosen",
    "components": ["the structural components"]
  },
  "suggestions": {
    "best_posting_times": ["suggested posting times"],
    "hashtags_to_consider": ["relevant hashtags"],
    "engagement_tips": ["tips to maximize engagement"],
    "a_b_test_variants": ["suggestions for A/B testing"]
  },
  "hook_analysis": {
    "hook_text": "the opening hook",
    "hook_type": "type of hook used",
    "effectiveness_score": number from 1-10
  }
}`

    const response = await this.chat({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: params.temperature || 0.7,
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      return JSON.parse(content) as GenerateContentResponse
    } catch {
      return {
        generated_post: content,
        format_used: {
          name: 'custom',
          description: 'Generated with custom format',
          components: []
        },
        suggestions: {
          best_posting_times: [],
          hashtags_to_consider: [],
          engagement_tips: [],
          a_b_test_variants: []
        },
        hook_analysis: {
          hook_text: '',
          hook_type: 'unknown',
          effectiveness_score: 5
        }
      }
    }
  }

  async extractContent(url: string): Promise<ExtractContentResponse> {
    const systemPrompt = `You are an expert content extractor. Your task is to visit URLs and extract the main content along with relevant metadata.

Extract:
1. The main content text
2. Title and description if available
3. Author information if available
4. Date if available
5. Any relevant metadata

Return your response as valid JSON only, no markdown formatting.`

    const userPrompt = `Extract the content from this URL:

URL: ${url}

Return your response as a JSON object with this exact structure:
{
  "extracted_content": "the main content text",
  "metadata": {
    "title": "page or content title",
    "description": "meta description or summary",
    "author": "author name if available",
    "published_date": "publication date if available",
    "platform": "platform name (linkedin, twitter, etc.)",
    "url": "the original url",
    "content_type": "post, article, video, etc."
  },
  "media": {
    "images": ["array of image URLs found"],
    "videos": ["array of video URLs found"],
    "has_media": boolean
  }
}`

    const response = await this.chat({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000,
      temperature: 0.2,
      return_citations: true,
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      const result = JSON.parse(content) as ExtractContentResponse
      result.citations = response.citations
      return result
    } catch {
      return {
        extracted_content: content,
        metadata: {
          title: '',
          description: '',
          author: null,
          published_date: null,
          platform: 'unknown',
          url: url,
          content_type: 'unknown'
        },
        media: {
          images: [],
          videos: [],
          has_media: false
        }
      }
    }
  }
}

export interface AnalyzePostResponse {
  platform: 'linkedin' | 'twitter' | 'unknown'
  content: string
  format_pattern: {
    type: string
    description: string
    components: string[]
  }
  engagement_signals: {
    emotional_triggers: string[]
    formatting_choices: string[]
    timing_indicators: string[]
    credibility_markers: string[]
  }
  estimated_metrics: {
    likes: number | null
    comments: number | null
    shares: number | null
    views: number | null
  }
  key_elements: {
    emojis: string[]
    hashtags: string[]
    mentions: string[]
    links: string[]
    structure: string
    word_count: number
    has_hook: boolean
    has_cta: boolean
  }
  raw_response?: string
}

export interface GenerateContentParams {
  topic: string
  target_audience: string
  format_type?: string
  tone?: string
  temperature?: number
}

export interface GenerateContentResponse {
  generated_post: string
  format_used: {
    name: string
    description: string
    components: string[]
  }
  suggestions: {
    best_posting_times: string[]
    hashtags_to_consider: string[]
    engagement_tips: string[]
    a_b_test_variants: string[]
  }
  hook_analysis: {
    hook_text: string
    hook_type: string
    effectiveness_score: number
  }
}

export interface ExtractContentResponse {
  extracted_content: string
  metadata: {
    title: string
    description: string
    author: string | null
    published_date: string | null
    platform: string
    url: string
    content_type: string
  }
  media: {
    images: string[]
    videos: string[]
    has_media: boolean
  }
  citations?: string[]
}

export class PerplexityAPIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'PerplexityAPIError'
  }
}

export class PerplexityRateLimitError extends PerplexityAPIError {
  constructor(message: string) {
    super(message, 429)
    this.name = 'PerplexityRateLimitError'
  }
}

export class PerplexityAuthError extends PerplexityAPIError {
  constructor(message: string) {
    super(message, 401)
    this.name = 'PerplexityAuthError'
  }
}

export function createPerplexityClient(): PerplexityClient {
  return new PerplexityClient()
}
