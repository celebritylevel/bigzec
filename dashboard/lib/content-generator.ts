import { 
  HookTemplate, 
  hookTemplates, 
  getRandomHook, 
  getHookExample,
  getHooksByEmotion,
  HookType
} from './hooks-library';
import { 
  CTATemplate,
  ctaTemplates, 
  getRandomCTA, 
  getCTAExample, 
  getRecommendedCTA,
  CTAType 
} from './cta-library';

export type Platform = 'linkedin' | 'twitter';
export type Tone = 'professional' | 'casual' | 'bold';

export interface ContentFormat {
  id: string;
  name: string;
  platform: Platform;
  structure: string[];
  hookTypes: HookType[];
  ctaTypes: CTAType[];
  avgEngagement: number;
  useCount: number;
}

export interface GeneratePostOptions {
  topic: string;
  platform: Platform;
  formatId?: string;
  tone?: Tone;
  targetAudience?: string;
  hookType?: HookType;
  ctaType?: CTAType;
  keyPoints?: string[];
  maxLength?: number;
  includeEmojis?: boolean;
  includeHashtags?: boolean;
}

export interface GeneratedContent {
  content: string;
  hook: string;
  cta: string;
  platform: Platform;
  characterCount: number;
  wordCount: number;
  hashtags: string[];
  estimatedReadTime: string;
  viralScore: number;
  suggestions: string[];
  isThread?: boolean;
  threadContent?: string[];
}

export interface ContentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

const PLATFORM_LIMITS = {
  linkedin: {
    optimal: 1500,
    max: 3000,
    min: 100
  },
  twitter: {
    optimal: 240,
    max: 280,
    min: 20
  }
};

const PLATFORM_CONFIGS = {
  linkedin: {
    emojiLimit: 4,
    hashtagRange: [3, 5] as [number, number],
    preferredHooks: ['story', 'listicle', 'bold_statement', 'counterintuitive'] as HookType[],
    preferredCTAs: ['question', 'comment', 'save', 'share'] as CTAType[],
    lineBreakStyle: 'double',
    toneModifiers: {
      professional: 'Use industry terminology, data-backed insights, and a thought leadership voice.',
      casual: 'Keep it conversational and relatable, like talking to a colleague.',
      bold: 'Make strong statements, take positions, and be controversial.'
    }
  },
  twitter: {
    emojiLimit: 2,
    hashtagRange: [1, 3] as [number, number],
    preferredHooks: ['question', 'bold_statement', 'controversial'] as HookType[],
    preferredCTAs: ['engagement', 'debate', 'follow'] as CTAType[],
    lineBreakStyle: 'single',
    toneModifiers: {
      professional: 'Be concise and authoritative.',
      casual: 'Keep it light and conversational.',
      bold: 'Make every word count, be provocative.'
    }
  }
};

export function generatePost(options: GeneratePostOptions): GeneratedContent {
  const {
    topic,
    platform,
    formatId,
    tone = 'professional',
    targetAudience,
    hookType,
    ctaType,
    keyPoints = [],
    maxLength,
    includeEmojis = true,
    includeHashtags = true
  } = options;

  const config = PLATFORM_CONFIGS[platform];
  const limits = PLATFORM_LIMITS[platform];
  const targetLength = maxLength || limits.optimal;

  const hook = selectHook(platform, hookType);
  const cta = selectCTA(platform, ctaType);
  
  const hookText = generateHookContent(hook, topic, tone);
  const bodyContent = generateBodyContent(topic, keyPoints, tone, platform, config);
  const ctaText = generateCTAContent(cta, topic);
  
  const hashtags = includeHashtags ? generateHashtags(topic, platform) : [];
  
  let content = assembleContent(hookText, bodyContent, ctaText, platform, config, includeEmojis);
  
  if (platform === 'twitter' && content.length > limits.max) {
    const threadResult = convertToThread(content, topic);
    return {
      ...threadResult,
      platform,
      hashtags,
      viralScore: calculateViralScore(content, platform),
      suggestions: generateSuggestions(content, platform)
    };
  }

  content = optimizeForPlatform(content, platform);

  return {
    content,
    hook: hookText,
    cta: ctaText,
    platform,
    characterCount: content.length,
    wordCount: content.split(/\s+/).length,
    hashtags,
    estimatedReadTime: calculateReadTime(content),
    viralScore: calculateViralScore(content, platform),
    suggestions: generateSuggestions(content, platform)
  };
}

function selectHook(platform: Platform, preferredType?: HookType): HookTemplate {
  if (preferredType) {
    return hookTemplates[preferredType];
  }
  
  const config = PLATFORM_CONFIGS[platform];
  const preferredHooks = config.preferredHooks;
  const selectedType = preferredHooks[Math.floor(Math.random() * preferredHooks.length)];
  return hookTemplates[selectedType];
}

function selectCTA(platform: Platform, preferredType?: CTAType): CTATemplate {
  if (preferredType) {
    return ctaTemplates[preferredType];
  }
  
  return getRecommendedCTA(platform);
}

function generateHookContent(hook: HookTemplate, topic: string, tone: Tone): string {
  const example = getHookExample(hook.type);
  
  if (hook.type === 'story') {
    return example.replace(/\[time\]/, 'years').replace(/\[X\]/, `learning about ${topic}`);
  }
  
  if (hook.type === 'listicle') {
    const number = Math.floor(Math.random() * 7) + 3;
    return `${number} things I wish I knew about ${topic}:`;
  }
  
  if (hook.type === 'bold_statement') {
    const statements = [
      `Most advice about ${topic} is wrong.`,
      `The old way of doing ${topic} is dead.`,
      `Everyone's doing ${topic} backwards.`
    ];
    return statements[Math.floor(Math.random() * statements.length)];
  }
  
  return example;
}

function generateBodyContent(
  topic: string, 
  keyPoints: string[], 
  tone: Tone, 
  platform: Platform,
  config: typeof PLATFORM_CONFIGS.linkedin
): string {
  const toneModifier = config.toneModifiers[tone];
  
  if (platform === 'linkedin') {
    return generateLinkedInBody(topic, keyPoints, tone);
  } else {
    return generateTwitterBody(topic, keyPoints, tone);
  }
}

function generateLinkedInBody(topic: string, keyPoints: string[], tone: Tone): string {
  const points = keyPoints.length > 0 ? keyPoints : generateDefaultPoints(topic, 3);
  
  let body = '\n\n';
  
  if (tone === 'bold') {
    body += `Here's what nobody tells you about ${topic}:\n\n`;
  } else if (tone === 'casual') {
    body += `Let me break this down:\n\n`;
  } else {
    body += `Key insights:\n\n`;
  }
  
  points.forEach((point, index) => {
    body += `${index + 1}. ${point}\n\n`;
  });
  
  return body;
}

function generateTwitterBody(topic: string, keyPoints: string[], tone: Tone): string {
  const points = keyPoints.length > 0 ? keyPoints.slice(0, 2) : generateDefaultPoints(topic, 2);
  
  let body = ' ';
  
  if (tone === 'bold') {
    body = ` The truth about ${topic}:`;
  } else {
    body = ` Quick take on ${topic}:`;
  }
  
  return body;
}

function generateDefaultPoints(topic: string, count: number): string[] {
  const templates = [
    `Focus on ${topic} fundamentals first`,
    `Consistency beats intensity in ${topic}`,
    `The best ${topic} strategy is the one you stick with`,
    `Start small, scale your ${topic} efforts`,
    `Measure what matters in ${topic}`,
    `Learn from those who've mastered ${topic}`
  ];
  
  return templates.slice(0, count);
}

function generateCTAContent(cta: CTATemplate, topic: string): string {
  return getCTAExample(cta.type);
}

function assembleContent(
  hook: string,
  body: string,
  cta: string,
  platform: Platform,
  config: typeof PLATFORM_CONFIGS.linkedin,
  includeEmojis: boolean
): string {
  let content = hook + body;
  
  if (platform === 'linkedin') {
    content += cta;
    
    if (includeEmojis) {
      content = addEmojis(content, config.emojiLimit);
    }
  } else {
    content += ` ${cta}`;
    
    if (includeEmojis) {
      content = addEmojis(content, config.emojiLimit);
    }
  }
  
  return content;
}

function addEmojis(content: string, limit: number): string {
  const emojis = ['💡', '🎯', '🚀', '✨', '💪', '🔥', '📌', '⚡'];
  const usedEmojis: string[] = [];
  
  const lines = content.split('\n');
  const modifiedLines = lines.map((line, index) => {
    if (line.match(/^\d+\./) && usedEmojis.length < limit) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      usedEmojis.push(emoji);
      return line + ' ' + emoji;
    }
    return line;
  });
  
  return modifiedLines.join('\n');
}

function generateHashtags(topic: string, platform: Platform): string[] {
  const config = PLATFORM_CONFIGS[platform];
  const [min, max] = config.hashtagRange;
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  
  const topicWords = topic.toLowerCase().split(' ');
  const baseTag = topicWords.join('');
  
  const hashtags = [`#${baseTag}`];
  
  const genericTags = platform === 'linkedin' 
    ? ['#leadership', '#growth', '#success', '#mindset', '#productivity']
    : ['#growth', '#tips', '#advice'];
  
  for (let i = 1; i < count && i < genericTags.length + 1; i++) {
    hashtags.push(genericTags[i - 1]);
  }
  
  return hashtags;
}

function convertToThread(content: string, topic: string): GeneratedContent {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
  const tweets: string[] = [];
  let currentTweet = '';
  
  sentences.forEach(sentence => {
    if ((currentTweet + sentence).length <= 270) {
      currentTweet += sentence;
    } else {
      if (currentTweet) tweets.push(currentTweet.trim());
      currentTweet = sentence;
    }
  });
  
  if (currentTweet) tweets.push(currentTweet.trim());
  
  const numberedTweets = tweets.map((tweet, i) => {
    const prefix = i === 0 ? '' : `${i + 1}/${tweets.length} `;
    return prefix + tweet;
  });
  
  return {
    content: numberedTweets[0],
    hook: numberedTweets[0].split(' ').slice(0, 10).join(' '),
    cta: numberedTweets[numberedTweets.length - 1],
    platform: 'twitter',
    characterCount: numberedTweets[0].length,
    wordCount: numberedTweets.join(' ').split(/\s+/).length,
    hashtags: [],
    estimatedReadTime: calculateReadTime(numberedTweets.join(' ')),
    viralScore: 70,
    suggestions: ['Thread created for longer content'],
    isThread: true,
    threadContent: numberedTweets
  };
}

export function applyFormat(content: string, format: ContentFormat): string {
  let formatted = content;
  
  format.structure.forEach(element => {
    if (!formatted.toLowerCase().includes(element.toLowerCase())) {
      formatted = element + '\n\n' + formatted;
    }
  });
  
  return formatted;
}

export function optimizeForPlatform(content: string, platform: Platform): string {
  const limits = PLATFORM_LIMITS[platform];
  
  if (platform === 'linkedin') {
    content = optimizeLinkedInFormatting(content);
    content = ensureOptimalLength(content, limits.optimal, platform);
  } else {
    content = optimizeTwitterFormatting(content);
  }
  
  return content;
}

function optimizeLinkedInFormatting(content: string): string {
  let optimized = content;
  
  optimized = optimized.replace(/\n{3,}/g, '\n\n');
  
  optimized = optimized.replace(/^([•\-\*])\s/gm, '• ');
  
  return optimized;
}

function optimizeTwitterFormatting(content: string): string {
  return content.trim();
}

function ensureOptimalLength(content: string, target: number, platform: Platform): string {
  const limits = PLATFORM_LIMITS[platform];
  
  if (platform === 'twitter' && content.length > limits.max) {
    return content.substring(0, limits.max - 3) + '...';
  }
  
  return content;
}

export function addViralElements(content: string, platform: Platform): string {
  const elements = {
    linkedin: [
      { pattern: /\b(secret|hidden| nobody knows)\b/gi, replacement: 'the unspoken truth' },
      { pattern: /\b(very important)\b/gi, replacement: 'crucial' }
    ],
    twitter: [
      { pattern: /\b(important)\b/gi, replacement: 'KEY' }
    ]
  };
  
  let enhanced = content;
  
  elements[platform].forEach(({ pattern, replacement }) => {
    enhanced = enhanced.replace(pattern, replacement);
  });
  
  if (platform === 'linkedin' && !content.includes('\n\n')) {
    const sentences = enhanced.match(/[^.!?]+[.!?]+/g) || [enhanced];
    if (sentences.length > 2) {
      enhanced = sentences.join('\n\n');
    }
  }
  
  return enhanced;
}

export function validateContent(content: string, platform: Platform): ContentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const limits = PLATFORM_LIMITS[platform];
  
  if (content.length < limits.min) {
    errors.push(`Content too short (${content.length} chars). Minimum: ${limits.min}`);
  }
  
  if (content.length > limits.max) {
    errors.push(`Content too long (${content.length} chars). Maximum: ${limits.max}`);
  }
  
  if (!content.trim()) {
    errors.push('Content is empty');
  }
  
  if (platform === 'twitter' && content.length > 250 && content.length <= 280) {
    warnings.push('Content is near character limit');
  }
  
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/g;
  const emojiCount = (content.match(emojiRegex) || []).length;
  const config = PLATFORM_CONFIGS[platform];
  if (emojiCount > config.emojiLimit) {
    warnings.push(`Too many emojis (${emojiCount}). Recommended: ${config.emojiLimit}`);
  }
  
  if (platform === 'linkedin') {
    const hashtags = content.match(/#\w+/g) || [];
    if (hashtags.length > 5) {
      warnings.push(`Too many hashtags (${hashtags.length}). Recommended: 3-5`);
    }
  }
  
  const score = calculateQualityScore(content, platform, errors, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

function calculateQualityScore(content: string, platform: Platform, errors: string[], warnings: string[]): number {
  let score = 100;
  
  score -= errors.length * 25;
  score -= warnings.length * 10;
  
  if (content.includes('\n') && platform === 'linkedin') {
    score += 5;
  }
  
  if (content.match(/^\d+\./m)) {
    score += 5;
  }
  
  if (content.includes('?')) {
    score += 3;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateViralScore(content: string, platform: Platform): number {
  let score = 50;
  
  const viralKeywords = ['secret', 'nobody', 'mistake', 'truth', 'shocking', 'finally', 'proven', 'guaranteed'];
  viralKeywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) score += 5;
  });
  
  if (content.includes('?')) score += 5;
  if (content.match(/\d+/)) score += 5;
  if (content.includes('\n\n')) score += 5;
  
  const hookIndicators = ['why', 'how', 'what', 'this', 'my', 'unpopular'];
  const firstWords = content.split(' ').slice(0, 3).join(' ').toLowerCase();
  hookIndicators.forEach(indicator => {
    if (firstWords.includes(indicator)) score += 5;
  });
  
  return Math.min(100, score);
}

function calculateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const seconds = Math.ceil(words / 4);
  
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  return `${Math.ceil(seconds / 60)} min`;
}

function generateSuggestions(content: string, platform: Platform): string[] {
  const suggestions: string[] = [];
  
  if (platform === 'linkedin') {
    if (!content.includes('\n\n')) {
      suggestions.push('Add line breaks for better readability');
    }
    if (!content.match(/^\d+\./m)) {
      suggestions.push('Consider using numbered points for clarity');
    }
    if (content.length < 500) {
      suggestions.push('Content could be expanded for more engagement');
    }
  }
  
  if (platform === 'twitter') {
    if (content.length > 250) {
      suggestions.push('Content is close to limit - consider shortening');
    }
  }
  
  if (!content.includes('?')) {
    suggestions.push('Consider adding a question to boost engagement');
  }
  
  return suggestions;
}

export function getPlatformLimits(platform: Platform) {
  return PLATFORM_LIMITS[platform];
}

export function getPlatformConfig(platform: Platform) {
  return PLATFORM_CONFIGS[platform];
}
