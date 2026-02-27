import { HookTemplate } from './hooks-library';
import { CTATemplate } from './cta-library';

export interface AnalyzePostParams {
  content: string;
  platform: 'linkedin' | 'twitter';
  engagementMetrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

export interface GeneratePostParams {
  topic: string;
  platform: 'linkedin' | 'twitter';
  tone?: 'professional' | 'casual' | 'bold';
  targetAudience?: string;
  hook?: HookTemplate;
  cta?: CTATemplate;
  keyPoints?: string[];
  formatId?: string;
  sourceContent?: string;
}

export interface ExtractContentParams {
  url: string;
  platform: 'linkedin' | 'twitter';
}

export function ANALYZE_POST_PROMPT(params: AnalyzePostParams): string {
  return `Analyze this viral ${params.platform} post and extract its winning elements.

POST CONTENT:
"""
${params.content}
"""

${params.engagementMetrics ? `
ENGAGEMENT METRICS:
- Likes: ${params.engagementMetrics.likes || 'N/A'}
- Comments: ${params.engagementMetrics.comments || 'N/A'}
- Shares: ${params.engagementMetrics.shares || 'N/A'}
` : ''}

Analyze and provide:
1. HOOK ANALYSIS: What type of hook is used? Why does it grab attention?
2. STRUCTURE: Break down the post structure (opening, body, CTA)
3. EMOTIONAL TRIGGERS: What emotions does it evoke?
4. KEY PATTERNS: What repeatable patterns make this successful?
5. FORMATTING: How is whitespace, line breaks, and formatting used?
6. TONE: What tone and voice is used?
7. VIRAL ELEMENTS: What makes this shareable?
8. IMPROVEMENT SUGGESTIONS: How could this be made even better?

Return as JSON:
{
  "hookType": "question|bold_statement|story|listicle|controversial|how_to|myth_buster|counterintuitive",
  "hookAnalysis": "detailed analysis",
  "structure": {
    "opening": "description",
    "body": "description", 
    "closing": "description"
  },
  "emotionalTriggers": ["trigger1", "trigger2"],
  "patterns": ["pattern1", "pattern2"],
  "formattingNotes": "description",
  "tone": "professional|casual|bold|inspirational|educational",
  "viralElements": ["element1", "element2"],
  "improvements": ["suggestion1", "suggestion2"],
  "viralScore": 1-100
}`;
}

export function GENERATE_LINKEDIN_PROMPT(params: GeneratePostParams): string {
  return `Generate a high-performing LinkedIn post about: "${params.topic}"

REQUIREMENTS:
- Platform: LinkedIn
- Tone: ${params.tone || 'professional'}
${params.targetAudience ? `- Target Audience: ${params.targetAudience}` : ''}
${params.hook ? `- Suggested Hook Type: ${params.hook.type}` : ''}
${params.cta ? `- Suggested CTA Type: ${params.cta.type}` : ''}
${params.keyPoints ? `- Key Points to Include:\n${params.keyPoints.map(p => `  • ${p}`).join('\n')}` : ''}
${params.sourceContent ? `- Source Material:\n"""${params.sourceContent}"""` : ''}

LINKEDIN BEST PRACTICES:
- Start with a compelling hook (first line is crucial)
- Use short paragraphs (1-2 sentences max)
- Include line breaks for readability
- Use bullet points for lists
- Add relevant emojis sparingly (2-4 max)
- End with an engaging CTA
- Optimal length: 1,200-1,500 characters
- Professional but conversational tone
- Share personal insights or stories
- Create curiosity or provide value

Generate a post that:
1. Opens with a scroll-stopping hook
2. Delivers value in the body
3. Ends with an engagement-driving CTA
4. Uses optimal formatting for readability
5. Includes subtle viral elements

Return as JSON:
{
  "content": "the full post content with proper formatting",
  "hook": "the opening hook used",
  "cta": "the call-to-action used",
  "characterCount": number,
  "hashtags": ["relevant", "hashtags"],
  "estimatedReadTime": "X seconds",
  "viralScore": 1-100,
  "toneUsed": "detected tone"
}`;
}

export function GENERATE_TWITTER_PROMPT(params: GeneratePostParams): string {
  return `Generate a high-performing Twitter post about: "${params.topic}"

REQUIREMENTS:
- Platform: Twitter/X
- Tone: ${params.tone || 'casual'}
${params.targetAudience ? `- Target Audience: ${params.targetAudience}` : ''}
${params.hook ? `- Suggested Hook Type: ${params.hook.type}` : ''}
${params.cta ? `- Suggested CTA Type: ${params.cta.type}` : ''}
${params.keyPoints ? `- Key Points to Include:\n${params.keyPoints.map(p => `  • ${p}`).join('\n')}` : ''}
${params.sourceContent ? `- Source Material:\n"""${params.sourceContent}"""` : ''}

TWITTER BEST PRACTICES:
- Under 280 characters for single tweet (unless thread)
- Punchy, concise language
- Use 1-2 relevant hashtags (not more)
- Strong hook in first 3 words
- Create curiosity or controversy
- Use line breaks effectively
- If longer content, format as thread
- Engaging questions work well
- Quote tweets and replies for engagement

Generate content that:
1. Immediately grabs attention
2. Delivers value quickly
3. Encourages engagement
4. Uses optimal hashtag placement

Return as JSON:
{
  "content": "the tweet content",
  "isThread": boolean,
  "threadContent": ["tweet 1", "tweet 2"] | null,
  "hook": "the opening hook used",
  "cta": "the call-to-action used",
  "characterCount": number,
  "hashtags": ["relevant", "hashtags"],
  "viralScore": 1-100,
  "toneUsed": "detected tone"
}`;
}

export function EXTRACT_CONTENT_PROMPT(params: ExtractContentParams): string {
  return `Extract and analyze the key content from this ${params.platform} URL for repurposing.

URL: ${params.url}

Extract:
1. Core message/topic
2. Key points made
3. Tone and style
4. Hook used
5. CTA used
6. Hashtags used
7. Notable formatting patterns

Return as JSON:
{
  "topic": "main topic",
  "coreMessage": "one sentence summary",
  "keyPoints": ["point1", "point2", "point3"],
  "tone": "professional|casual|bold|etc",
  "hook": {
    "type": "hook type",
    "content": "actual hook text"
  },
  "cta": {
    "type": "cta type", 
    "content": "actual cta text"
  },
  "hashtags": ["tag1", "tag2"],
  "formattingPatterns": ["pattern1", "pattern2"],
  "wordCount": number,
  "readingLevel": "grade level estimate",
  "repurposeSuggestions": ["suggestion1", "suggestion2"]
}`;
}

export function REFINE_CONTENT_PROMPT(content: string, feedback: string, platform: 'linkedin' | 'twitter'): string {
  return `Refine this ${platform} post based on feedback.

ORIGINAL CONTENT:
"""
${content}
"""

FEEDBACK:
${feedback}

Apply the feedback while:
- Maintaining the core message
- Keeping optimal length for ${platform}
- Preserving viral elements
- Ensuring readability

Return as JSON:
{
  "refinedContent": "the improved post",
  "changes": ["change1", "change2"],
  "improvementNotes": "what was improved"
}`;
}

export function SPLIT_TO_THREAD_PROMPT(content: string): string {
  return `Split this content into a Twitter thread for maximum engagement.

CONTENT:
"""
${content}
"""

Requirements:
- Each tweet under 280 characters
- Create natural break points
- Number the tweets (1/X, 2/X, etc.)
- First tweet should be the hook
- Last tweet should include CTA
- Maintain narrative flow
- Keep reader wanting more

Return as JSON:
{
  "tweets": [
    {
      "number": 1,
      "content": "tweet content",
      "characterCount": number
    }
  ],
  "totalTweets": number,
  "hook": "opening hook used",
  "cta": "closing CTA used"
}`;
}

export function GENERATE_HASHTAGS_PROMPT(topic: string, platform: 'linkedin' | 'twitter'): string {
  return `Generate optimal hashtags for a ${platform} post about: "${topic}"

Requirements:
${platform === 'twitter' ? '- Max 2-3 hashtags for Twitter' : '- 3-5 hashtags for LinkedIn'}
- Mix of popular and niche tags
- Relevant to content
- Avoid overused/generic tags

Return as JSON:
{
  "hashtags": ["tag1", "tag2", "tag3"],
  "primaryHashtag": "most important tag",
  "nicheHashtags": ["niche1", "niche2"],
  "trendingHashtags": ["trending1"],
  "recommendations": "when to use each"
}`;
}
