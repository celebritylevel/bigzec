/**
 * Viral Post Analyzer
 * 
 * Core analysis logic for detecting viral patterns in social media posts.
 * This module analyzes posts to understand what makes them successful and
 * extracts actionable insights for content generation.
 * 
 * Key Analysis Areas:
 * 1. Hook Detection - How does the post grab attention?
 * 2. Body Structure - How is the content organized?
 * 3. CTA Analysis - What action does the post prompt?
 * 4. Viral Signals - What elements contribute to virality?
 * 5. Scoring - Overall virality potential assessment
 */

import {
  ViralPost,
  ParsedContent,
  FormatPattern,
  ViralSignals,
  AnalysisResult,
  DetectedFormatPattern,
  HookType,
  BodyType,
  CTAType,
  EmotionalTrigger,
  FormatElement,
  TimingSignal,
  TopicRelevance,
  ViralityIndicator,
  Platform,
  LineBreakStructure,
  CapitalizationPattern
} from './types/social-media'

const HOOK_PATTERNS: Record<HookType, RegExp[]> = {
  [HookType.QUESTION]: [
    /^(what|why|how|when|where|who|which|do you|did you|have you|are you|is your|would you|could you)/i,
    /\?$/,
    /^(ever wondered|have you ever|did you know)/i
  ],
  [HookType.BOLD_STATEMENT]: [
    /^(this is|here's the truth|let me be clear|i'll say it|the truth is|here's what nobody tells you)/i,
    /^(stop|don't|never|always|everyone|nobody|nothing|everything)/i,
    /\b(unpopular opinion|hot take|controversial opinion)\b/i
  ],
  [HookType.STORY]: [
    /^(so|i was|last week|yesterday|a few years ago|when i started|back in|my journey)/i,
    /^(story time|let me tell you|here's a story)/i,
    /\b(my story|this changed everything|turning point)\b/i
  ],
  [HookType.LIST]: [
    /^(\d+\s+(ways|things|reasons|tips|secrets|mistakes|lessons|habits|books|tools|apps))/i,
    /^(here are|here's \d+|top \d+|best \d+|\d+ of the)/i,
    /\b(step by step|checklist)\b/i
  ],
  [HookType.CONTROVERSIAL_TAKE]: [
    /^(unpopular opinion|hot take|controversial|i'll probably get hate|this might upset)/i,
    /\b(is overrated|is underrated|everyone is wrong|the industry is|nobody talks about)\b/i,
    /\b(gatekeep|red flag|toxic|problematic)\b/i
  ],
  [HookType.STATISTIC]: [
    /^(\d+%|according to|studies show|research shows|data shows|statistics show)/i,
    /\b(in \d+ years|by \d+|only \d+%|more than \d+)/i,
    /\b(million|billion|trillion)\b/i
  ],
  [HookType.QUOTE]: [
    /^["']|^\w+\s+once\s+said|^(as |"|\u201C)/i,
    /\b(said it best|famous words|wisdom from)\b/i
  ],
  [HookType.HOW_TO]: [
    /^(how to|how i|how you can|how we|the complete guide|ultimate guide|step-by-step)/i,
    /\b(learn to|mastering|guide to|roadmap to)\b/i
  ],
  [HookType.NONE]: []
}

const BODY_PATTERNS: Record<BodyType, { patterns: RegExp[]; indicators: string[] }> = {
  [BodyType.PROBLEM_SOLUTION]: {
    patterns: [
      /\b(problem|issue|challenge|struggle|pain point)\b.*\b(solution|fix|answer|resolve|solve)\b/is,
      /\b(here's how (i |we |you )?(solved|fixed|overcame))/i,
      /\b(the fix|the solution|what worked)\b/i
    ],
    indicators: ['problem-solution', 'challenge-overcome', 'struggle-resolution']
  },
  [BodyType.STORY_DRIVEN]: {
    patterns: [
      /^(so|i was|when i|my journey|my story)/i,
      /\b(then one day|that's when|fast forward|years later)\b/i,
      /\b(the turning point|everything changed|this moment)\b/i
    ],
    indicators: ['narrative', 'personal-experience', 'chronological']
  },
  [BodyType.LISTICLE]: {
    patterns: [
      /^(\d+\.|1\.|•|-|→)/m,
      /\n\d+\./m,
      /\n(•|-|→|✓|✗|▸)/m
    ],
    indicators: ['numbered-list', 'bullet-points', 'enumerated-items']
  },
  [BodyType.TUTORIAL]: {
    patterns: [
      /\b(step \d+|first|then|next|finally|lastly)\b/i,
      /\b(here's how|follow these|do this)\b/i,
      /\b(tutorial|guide|walkthrough)\b/i
    ],
    indicators: ['step-by-step', 'instructional', 'how-to']
  },
  [BodyType.INSIGHT_SHARING]: {
    patterns: [
      /\b(i learned|i realized|the key insight|my biggest takeaway)\b/i,
      /\b(here's what|i discovered|what i wish i knew)\b/i,
      /\b(the secret|the truth about|reality is)\b/i
    ],
    indicators: ['wisdom', 'lesson', 'insight', 'realization']
  },
  [BodyType.COMPARISON]: {
    patterns: [
      /\b(vs\.?|versus|compared to|instead of|rather than)\b/i,
      /\b(the difference between|this vs that)\b/i,
      /\b(while|whereas|on the other hand)\b/i
    ],
    indicators: ['comparison', 'contrast', 'versus']
  },
  [BodyType.MYTH_BUSTING]: {
    patterns: [
      /\b(myth|misconception|wrong about|false|lie|believe)\b/i,
      /\b(don't believe|stop believing|the truth about|debunking)\b/i,
      /\b(actually|in reality|the reality is)\b/i
    ],
    indicators: ['myth', 'misconception', 'debunking', 'truth-reveal']
  },
  [BodyType.LESSON_LEARNED]: {
    patterns: [
      /\b(lesson|learned|mistake i made|what i learned|biggest lesson)\b/i,
      /\b(if i could go back|i wish i knew|i would tell my younger)\b/i,
      /\b(regret|wish i had|should have)\b/i
    ],
    indicators: ['lesson', 'mistake', 'regret', 'learning']
  },
  [BodyType.THREAD]: {
    patterns: [
      /\b(thread|🧵|a thread)\b/i,
      /\n\d+\/\d+/m,
      /\b(part \d+|continued|follow for more)\b/i
    ],
    indicators: ['thread', 'series', 'multi-part']
  },
  [BodyType.NARRATIVE]: {
    patterns: [
      /\b(once upon|picture this|imagine|let me paint a picture)\b/i,
      /\b(the story of|this is the story|tale of)\b/i,
      /\b(it all started|in the beginning)\b/i
    ],
    indicators: ['narrative', 'storytelling', 'scenario']
  }
}

const CTA_PATTERNS: Record<CTAType, RegExp[]> = {
  [CTAType.QUESTION_TO_AUDIENCE]: [
    /\?$/,
    /\b(what do you think|your thoughts|agree or disagree|what's your|how do you|share your)\b.*\?/i,
    /\b(let me know|tell me|comment below)\b.*\?/i
  ],
  [CTAType.LINK]: [
    /https?:\/\//,
    /\b(link in bio|check the link|visit|click here|read more at)\b/i,
    /\b(link|article|blog|podcast|video)\b.*\b(below|here)\b/i
  ],
  [CTAType.ENGAGEMENT_BAIT]: [
    /\b(like if|comment|share|save|follow|subscribe|retweet)\b/i,
    /\b(drop a|leave a|type|drop your)\b.*\b(comment|below|emoji|reply)\b/i,
    /\b(double tap|hit that|smash that)\b/i
  ],
  [CTAType.FOLLOW_UP]: [
    /\b(follow for|stay tuned|coming next|tomorrow i'll|next post)\b/i,
    /\b(to be continued|part \d+|more to come)\b/i,
    /\b(turn on notifications|enable notifications)\b/i
  ],
  [CTAType.SAVE_FOR_LATER]: [
    /\b(save this|bookmark|pin this|save for later)\b/i,
    /\b(save this post|worth saving|reference)\b/i
  ],
  [CTAType.SHARE]: [
    /\b(share this|send this to|tag someone|forward this)\b/i,
    /\b(this might help someone|someone needs to hear this)\b/i,
    /\b(repost|retweet|share with your)\b/i
  ],
  [CTAType.COMMENT_PROMPT]: [
    /\b(comment|reply|drop|type)\b.*\b(below|your|an? emoji)\b/i,
    /\b(starting a discussion|let's discuss|conversation starter)\b/i,
    /\b(i want to hear from you|tell me about)\b/i
  ],
  [CTAType.NONE]: []
}

const EMOTIONAL_TRIGGER_WORDS: Record<EmotionalTrigger, string[]> = {
  [EmotionalTrigger.CURIOSITY]: ['secret', 'hidden', 'nobody knows', 'revealed', 'discover', 'find out', 'you need to see', 'must read'],
  [EmotionalTrigger.FEAR]: ['avoid', 'danger', 'warning', 'careful', 'don\'t make this mistake', 'at risk', 'losing', 'scared'],
  [EmotionalTrigger.EXCITEMENT]: ['amazing', 'incredible', 'breakthrough', 'revolutionary', 'game-changer', 'exciting', 'thrilled'],
  [EmotionalTrigger.VALIDATION]: ['you\'re not alone', 'it\'s okay', 'normal', 'everyone struggles', 'you deserve', 'your feelings'],
  [EmotionalTrigger.SURPRISE]: ['shocking', 'unexpected', 'you won\'t believe', 'surprising', 'never thought', 'plot twist'],
  [EmotionalTrigger.ANGER]: ['outrageous', 'unacceptable', 'ridiculous', 'angry', 'frustrated', 'unfair', 'injustice'],
  [EmotionalTrigger.NOSTALGIA]: ['remember when', 'back in the day', 'used to', 'growing up', 'childhood', 'the good old'],
  [EmotionalTrigger.INSPIRATION]: ['dream', 'believe', 'achieve', 'success', 'inspire', 'motivate', 'you can do it', 'never give up'],
  [EmotionalTrigger.FRUSTRATION]: ['tired of', 'sick of', 'enough is enough', 'frustrating', 'annoying', 'sick and tired'],
  [EmotionalTrigger.HOPE]: ['hope', 'opportunity', 'possible', 'bright future', 'looking forward', 'optimistic', 'better days'],
  [EmotionalTrigger.URGENCY]: ['now', 'today', 'immediately', 'don\'t wait', 'running out', 'limited time', 'before it\'s too late'],
  [EmotionalTrigger.FOMO]: ['everyone is', 'don\'t miss', 'last chance', 'exclusive', 'only', ' spots left', 'before everyone else']
}

/**
 * Parses post content into a structured format for analysis.
 * Extracts all relevant text features including formatting, special characters,
 * and structural elements that contribute to post performance.
 * 
 * @param content - Raw post content string
 * @returns Structured ParsedContent object with all extracted features
 * 
 * @example
 * const parsed = parsePostContent("What's your biggest challenge? 🚀 #entrepreneur")
 * // Returns object with wordCount, hashtags, emojis, etc.
 */
export function parsePostContent(content: string): ParsedContent {
  const lines = content.split('\n').filter(line => line.trim().length > 0)
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const words = content.split(/\s+/).filter(w => w.length > 0)
  
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const emojis = content.match(emojiRegex) || []
  
  const hashtagRegex = /#[\w]+/g
  const hashtags = content.match(hashtagRegex) || []
  
  const mentionRegex = /@[\w]+/g
  const mentions = content.match(mentionRegex) || []
  
  const urlRegex = /https?:\/\/[^\s]+/g
  const links = content.match(urlRegex) || []
  
  const numberRegex = /\b\d+(?:,\d{3})*(?:\.\d+)?%?\b/g
  const numbers = content.match(numberRegex) || []
  
  return {
    original: content,
    lines,
    paragraphs,
    wordCount: words.length,
    characterCount: content.length,
    hasEmoji: emojis.length > 0,
    emojiCount: emojis.length,
    hasHashtags: hashtags.length > 0,
    hashtags,
    hasMentions: mentions.length > 0,
    mentions,
    hasLinks: links.length > 0,
    links,
    hasNumbers: numbers.length > 0,
    numbers,
    capitalizationPatterns: analyzeCapitalization(content),
    lineBreakStructure: analyzeLineBreaks(lines)
  }
}

/**
 * Identifies the format pattern used in a viral post.
 * Analyzes hook type, body structure, and call-to-action patterns
 * to determine the overall format classification.
 * 
 * @param parsed - ParsedContent object from parsePostContent
 * @param platform - Target platform for platform-specific analysis
 * @returns DetectedFormatPattern with confidence scores for each element
 * 
 * @example
 * const pattern = identifyFormatPattern(parsed, 'linkedin')
 * // Returns { hookType: HookType.QUESTION, bodyType: BodyType.LISTICLE, ... }
 */
export function identifyFormatPattern(
  parsed: ParsedContent,
  platform: Platform
): DetectedFormatPattern {
  const hookResult = detectHookType(parsed)
  const bodyResult = detectBodyType(parsed)
  const ctaResult = detectCTAType(parsed)
  
  return {
    hookType: hookResult.type,
    hookConfidence: hookResult.confidence,
    hookText: hookResult.matchedText,
    bodyType: bodyResult.type,
    bodyConfidence: bodyResult.confidence,
    bodyStructure: bodyResult.structure,
    ctaType: ctaResult.type,
    ctaConfidence: ctaResult.confidence,
    ctaText: ctaResult.matchedText
  }
}

/**
 * Extracts viral signals from a post that contribute to its success.
 * Identifies emotional triggers, format elements, timing signals,
 * and topic relevance factors.
 * 
 * @param parsed - ParsedContent object
 * @param platform - Target platform
 * @returns ViralSignals object containing all detected viral factors
 * 
 * @example
 * const signals = extractViralSignals(parsed, 'twitter')
 * // Returns emotional triggers, format elements, etc.
 */
export function extractViralSignals(
  parsed: ParsedContent,
  platform: Platform
): ViralSignals {
  return {
    emotionalTriggers: detectEmotionalTriggers(parsed),
    formatElements: analyzeFormatElements(parsed, platform),
    timingSignals: detectTimingSignals(parsed),
    topicRelevance: analyzeTopicRelevance(parsed),
    viralityIndicators: calculateViralityIndicators(parsed, platform)
  }
}

/**
 * Calculates an overall virality score for a post.
 * Combines multiple factors including engagement metrics, format patterns,
 * viral signals, and platform-specific optimizations.
 * 
 * Score ranges from 0-100 with the following breakdown:
 * - Hook effectiveness: 0-25 points
 * - Body structure: 0-25 points
 * - CTA effectiveness: 0-15 points
 * - Emotional triggers: 0-15 points
 * - Format optimization: 0-10 points
 * - Platform fit: 0-10 points
 * 
 * @param post - ViralPost object with content and metrics
 * @param parsed - ParsedContent object
 * @param formatPattern - DetectedFormatPattern
 * @param signals - ViralSignals
 * @returns Numeric score from 0-100
 */
export function calculateViralityScore(
  post: ViralPost,
  parsed: ParsedContent,
  formatPattern: DetectedFormatPattern,
  signals: ViralSignals
): number {
  let score = 0
  
  score += calculateHookScore(formatPattern)
  score += calculateBodyScore(parsed, formatPattern)
  score += calculateCTAScore(formatPattern)
  score += calculateEmotionalScore(signals)
  score += calculateFormatScore(parsed, post.platform)
  score += calculatePlatformFitScore(parsed, post.platform)
  
  if (post.metrics.engagementRate && post.metrics.engagementRate > 5) {
    score = Math.min(100, score * 1.1)
  }
  
  return Math.min(100, Math.round(score))
}

/**
 * Performs complete analysis of a viral post.
 * Combines all analysis functions into a single comprehensive result.
 * 
 * @param post - ViralPost to analyze
 * @returns Complete AnalysisResult with all analysis components
 */
export function analyzePost(post: ViralPost): AnalysisResult {
  const parsed = parsePostContent(post.content)
  const formatPattern = identifyFormatPattern(parsed, post.platform)
  const viralSignals = extractViralSignals(parsed, post.platform)
  const viralityScore = calculateViralityScore(post, parsed, formatPattern, viralSignals)
  
  return {
    postId: post.id,
    viralityScore,
    confidence: calculateOverallConfidence(formatPattern, viralSignals),
    formatPattern,
    viralSignals,
    recommendations: generateRecommendations(parsed, formatPattern, viralSignals, post.platform),
    similarFormats: findSimilarFormats(formatPattern),
    analyzedAt: new Date().toISOString()
  }
}

function analyzeCapitalization(content: string): CapitalizationPattern {
  const words = content.split(/\s+/)
  const allCapsWords = words.filter(w => w.length > 1 && w === w.toUpperCase() && /[A-Z]/.test(w))
  
  const titleCaseWords = words.filter(w => {
    const letters = w.replace(/[^a-zA-Z]/g, '')
    return letters.length > 0 && 
           letters[0] === letters[0].toUpperCase() && 
           letters.slice(1) === letters.slice(1).toLowerCase()
  })
  
  const letterWords = words.filter(w => /[a-zA-Z]/.test(w))
  const avgLength = letterWords.length > 0 
    ? letterWords.reduce((sum, w) => sum + w.length, 0) / letterWords.length 
    : 0
  
  return {
    hasAllCaps: allCapsWords.length > 0,
    allCapsWords,
    hasTitleCase: titleCaseWords.length > 0,
    averageWordLength: Math.round(avgLength * 10) / 10
  }
}

function analyzeLineBreaks(lines: string[]): LineBreakStructure {
  const lengths = lines.map(l => l.length)
  const avgLength = lengths.length > 0 
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length 
    : 0
  
  return {
    totalLineBreaks: lines.length - 1,
    averageLineLength: Math.round(avgLength),
    shortLines: lengths.filter(l => l < 30).length,
    mediumLines: lengths.filter(l => l >= 30 && l < 100).length,
    longLines: lengths.filter(l => l >= 100).length,
    hasDoubleLineBreaks: lines.some(l => l.trim().length === 0)
  }
}

function detectHookType(parsed: ParsedContent): { 
  type: HookType; 
  confidence: number; 
  matchedText: string 
} {
  const firstLine = parsed.lines[0]?.toLowerCase() || ''
  const firstTwoLines = parsed.lines.slice(0, 2).join(' ').toLowerCase()
  
  let bestMatch: { type: HookType; confidence: number; matchedText: string } = {
    type: HookType.NONE,
    confidence: 0,
    matchedText: ''
  }
  
  for (const [hookType, patterns] of Object.entries(HOOK_PATTERNS)) {
    if (hookType === HookType.NONE) continue
    
    for (const pattern of patterns) {
      const match = firstLine.match(pattern) || firstTwoLines.match(pattern)
      if (match) {
        const confidence = match.index === 0 ? 0.9 : 0.7
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            type: hookType as HookType,
            confidence,
            matchedText: match[0]
          }
        }
      }
    }
  }
  
  if (parsed.lines[0]?.endsWith('?') && bestMatch.confidence < 0.8) {
    bestMatch = {
      type: HookType.QUESTION,
      confidence: 0.85,
      matchedText: parsed.lines[0]
    }
  }
  
  return bestMatch
}

function detectBodyType(parsed: ParsedContent): { 
  type: BodyType; 
  confidence: number; 
  structure: string 
} {
  const content = parsed.original.toLowerCase()
  let bestMatch: { type: BodyType; confidence: number; structure: string } = {
    type: BodyType.INSIGHT_SHARING,
    confidence: 0.3,
    structure: 'general'
  }
  
  const hasNumberedItems = /\n\d+\./.test(parsed.original)
  const hasBulletPoints = /\n[•\-\*→]/.test(parsed.original)
  
  if (hasNumberedItems || hasBulletPoints) {
    const itemCount = (parsed.original.match(/\n\d+\./g) || []).length + 
                      (parsed.original.match(/\n[•\-\*→]/g) || []).length
    return {
      type: BodyType.LISTICLE,
      confidence: 0.9,
      structure: `${itemCount} items`
    }
  }
  
  for (const [bodyType, { patterns, indicators }] of Object.entries(BODY_PATTERNS)) {
    let matchCount = 0
    let matchedIndicator = ''
    
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        matchCount++
      }
    }
    
    for (const indicator of indicators) {
      if (content.includes(indicator.replace('-', ' '))) {
        matchedIndicator = indicator
        matchCount += 0.5
      }
    }
    
    if (matchCount > 0) {
      const confidence = Math.min(0.9, 0.4 + (matchCount * 0.15))
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          type: bodyType as BodyType,
          confidence,
          structure: matchedIndicator || 'pattern-detected'
        }
      }
    }
  }
  
  return bestMatch
}

function detectCTAType(parsed: ParsedContent): { 
  type: CTAType; 
  confidence: number; 
  matchedText: string 
} {
  const lastLines = parsed.lines.slice(-3).join(' ').toLowerCase()
  const fullContent = parsed.original.toLowerCase()
  
  let bestMatch: { type: CTAType; confidence: number; matchedText: string } = {
    type: CTAType.NONE,
    confidence: 0,
    matchedText: ''
  }
  
  for (const [ctaType, patterns] of Object.entries(CTA_PATTERNS)) {
    if (ctaType === CTAType.NONE) continue
    
    for (const pattern of patterns) {
      const match = lastLines.match(pattern) || fullContent.match(pattern)
      if (match) {
        const confidence = lastLines.includes(match[0]) ? 0.85 : 0.7
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            type: ctaType as CTAType,
            confidence,
            matchedText: match[0]
          }
        }
      }
    }
  }
  
  if (parsed.lines[parsed.lines.length - 1]?.endsWith('?') && bestMatch.confidence < 0.7) {
    bestMatch = {
      type: CTAType.QUESTION_TO_AUDIENCE,
      confidence: 0.75,
      matchedText: parsed.lines[parsed.lines.length - 1]
    }
  }
  
  if (parsed.hasLinks && bestMatch.confidence < 0.6) {
    bestMatch = {
      type: CTAType.LINK,
      confidence: 0.6,
      matchedText: parsed.links[0]
    }
  }
  
  return bestMatch
}

function detectEmotionalTriggers(parsed: ParsedContent): EmotionalTrigger[] {
  const content = parsed.original.toLowerCase()
  const detectedTriggers: EmotionalTrigger[] = []
  
  for (const [trigger, words] of Object.entries(EMOTIONAL_TRIGGER_WORDS)) {
    for (const word of words) {
      if (content.includes(word.toLowerCase())) {
        if (!detectedTriggers.includes(trigger as EmotionalTrigger)) {
          detectedTriggers.push(trigger as EmotionalTrigger)
        }
        break
      }
    }
  }
  
  return detectedTriggers
}

function analyzeFormatElements(parsed: ParsedContent, platform: Platform): FormatElement[] {
  const elements: FormatElement[] = []
  
  elements.push({
    type: 'emoji_usage',
    present: parsed.hasEmoji,
    count: parsed.emojiCount,
    significance: platform === 'twitter' ? 'medium' : 'high'
  })
  
  elements.push({
    type: 'hashtag_usage',
    present: parsed.hasHashtags,
    count: parsed.hashtags.length,
    significance: platform === 'twitter' ? 'high' : 'medium'
  })
  
  elements.push({
    type: 'line_breaks',
    present: parsed.lineBreakStructure.totalLineBreaks > 0,
    count: parsed.lineBreakStructure.totalLineBreaks,
    significance: platform === 'linkedin' ? 'high' : 'medium'
  })
  
  elements.push({
    type: 'all_caps_emphasis',
    present: parsed.capitalizationPatterns.hasAllCaps,
    count: parsed.capitalizationPatterns.allCapsWords.length,
    significance: 'high'
  })
  
  elements.push({
    type: 'number_inclusion',
    present: parsed.hasNumbers,
    count: parsed.numbers.length,
    significance: 'high'
  })
  
  elements.push({
    type: 'list_formatting',
    present: /\n[•\-\*→]|\n\d+\./.test(parsed.original),
    count: (parsed.original.match(/\n[•\-\*→]|\n\d+\./g) || []).length,
    significance: 'high'
  })
  
  return elements
}

function detectTimingSignals(parsed: ParsedContent): TimingSignal[] {
  const signals: TimingSignal[] = []
  const content = parsed.original.toLowerCase()
  
  const timePatterns = [
    { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, type: 'day_mention' },
    { pattern: /\b(morning|afternoon|evening|night)\b/i, type: 'time_of_day' },
    { pattern: /\b(today|tomorrow|yesterday|this week|next week)\b/i, type: 'temporal_reference' },
    { pattern: /\b(now|right now|at this moment|currently)\b/i, type: 'urgency_marker' },
    { pattern: /\b(\d+ (days|weeks|months|years) ago)\b/i, type: 'past_reference' }
  ]
  
  for (const { pattern, type } of timePatterns) {
    const match = content.match(pattern)
    if (match) {
      signals.push({
        type,
        detected: true,
        context: match[0]
      })
    }
  }
  
  return signals
}

function analyzeTopicRelevance(parsed: ParsedContent): TopicRelevance[] {
  const topics: TopicRelevance[] = []
  const content = parsed.original.toLowerCase()
  
  const topicPatterns = [
    { topic: 'entrepreneurship', keywords: ['startup', 'business', 'entrepreneur', 'founder', 'ceo'] },
    { topic: 'career', keywords: ['job', 'career', 'interview', 'resume', 'hiring', 'work'] },
    { topic: 'technology', keywords: ['ai', 'tech', 'software', 'code', 'developer', 'programming'] },
    { topic: 'finance', keywords: ['money', 'invest', 'stock', 'crypto', 'finance', 'wealth'] },
    { topic: 'self-improvement', keywords: ['growth', 'habits', 'productivity', 'mindset', 'success'] },
    { topic: 'leadership', keywords: ['leader', 'management', 'team', 'manager', 'lead'] }
  ]
  
  for (const { topic, keywords } of topicPatterns) {
    const matchCount = keywords.filter(kw => content.includes(kw)).length
    if (matchCount > 0) {
      topics.push({
        topic,
        relevanceScore: Math.min(1, matchCount * 0.3),
        trending: isTopicTrending(topic)
      })
    }
  }
  
  return topics.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

function isTopicTrending(topic: string): boolean {
  const trendingTopics = ['ai', 'entrepreneurship', 'remote-work', 'mental-health', 'sustainability']
  return trendingTopics.includes(topic.toLowerCase())
}

function calculateViralityIndicators(parsed: ParsedContent, platform: Platform): ViralityIndicator[] {
  const indicators: ViralityIndicator[] = []
  
  indicators.push({
    indicator: 'optimal_length',
    score: calculateLengthScore(parsed, platform),
    reason: getLengthReason(parsed, platform)
  })
  
  indicators.push({
    indicator: 'hook_strength',
    score: calculateHookStrengthScore(parsed),
    reason: 'First line engagement potential'
  })
  
  indicators.push({
    indicator: 'readability',
    score: calculateReadabilityScore(parsed),
    reason: 'Content structure and flow'
  })
  
  indicators.push({
    indicator: 'engagement_potential',
    score: calculateEngagementPotential(parsed),
    reason: 'Elements that encourage interaction'
  })
  
  return indicators
}

function calculateLengthScore(parsed: ParsedContent, platform: Platform): number {
  const optimalLength = platform === 'linkedin' 
    ? { min: 150, max: 300, optimal: 200 }
    : { min: 50, max: 280, optimal: 150 }
  
  const length = parsed.wordCount
  
  if (length >= optimalLength.min && length <= optimalLength.max) {
    return 100
  } else if (length < optimalLength.min) {
    return Math.max(0, 100 - (optimalLength.min - length) * 2)
  } else {
    return Math.max(0, 100 - (length - optimalLength.max) * 0.5)
  }
}

function calculateHookStrengthScore(parsed: ParsedContent): number {
  const firstLine = parsed.lines[0] || ''
  let score = 50
  
  if (firstLine.endsWith('?')) score += 20
  if (/[A-Z]{2,}/.test(firstLine)) score += 15
  if (/^\d+/.test(firstLine)) score += 15
  if (firstLine.length < 100) score += 10
  if (/[\u{1F300}-\u{1F9FF}]/u.test(firstLine)) score += 10
  
  return Math.min(100, score)
}

function calculateReadabilityScore(parsed: ParsedContent): number {
  let score = 70
  
  if (parsed.lineBreakStructure.averageLineLength < 80) score += 10
  if (parsed.paragraphs.length > 1) score += 10
  if (parsed.lineBreakStructure.shortLines > parsed.lineBreakStructure.longLines) score += 5
  if (parsed.capitalizationPatterns.averageWordLength < 6) score += 5
  
  return Math.min(100, score)
}

function calculateEngagementPotential(parsed: ParsedContent): number {
  let score = 40
  
  if (parsed.hasEmoji) score += 15
  if (parsed.hasHashtags) score += 10
  if (parsed.hasNumbers) score += 15
  if (parsed.original.includes('?')) score += 10
  if (/\n[•\-\*→]|\n\d+\./.test(parsed.original)) score += 10
  
  return Math.min(100, score)
}

function getLengthReason(parsed: ParsedContent, platform: Platform): string {
  const length = parsed.wordCount
  if (platform === 'linkedin') {
    if (length < 100) return 'Post is quite short for LinkedIn'
    if (length > 500) return 'Post may be too long for optimal engagement'
    return 'Good length for LinkedIn engagement'
  } else {
    if (length < 50) return 'Very short for Twitter'
    if (length > 280) return 'May need thread format'
    return 'Good length for Twitter engagement'
  }
}

function calculateHookScore(formatPattern: DetectedFormatPattern): number {
  const baseScore = formatPattern.hookType !== HookType.NONE ? 15 : 5
  const confidenceBonus = formatPattern.hookConfidence * 10
  return Math.min(25, baseScore + confidenceBonus)
}

function calculateBodyScore(parsed: ParsedContent, formatPattern: DetectedFormatPattern): number {
  let score = 10
  
  if (formatPattern.bodyType !== BodyType.INSIGHT_SHARING) score += 8
  score += formatPattern.bodyConfidence * 7
  
  if (parsed.lineBreakStructure.totalLineBreaks > 3) score += 3
  if (parsed.paragraphs.length > 1) score += 2
  
  return Math.min(25, score)
}

function calculateCTAScore(formatPattern: DetectedFormatPattern): number {
  if (formatPattern.ctaType === CTAType.NONE) return 5
  
  const ctaScores: Record<CTAType, number> = {
    [CTAType.QUESTION_TO_AUDIENCE]: 15,
    [CTAType.ENGAGEMENT_BAIT]: 14,
    [CTAType.COMMENT_PROMPT]: 13,
    [CTAType.SHARE]: 12,
    [CTAType.SAVE_FOR_LATER]: 11,
    [CTAType.LINK]: 10,
    [CTAType.FOLLOW_UP]: 9,
    [CTAType.NONE]: 5
  }
  
  const baseScore = ctaScores[formatPattern.ctaType] || 8
  const confidenceBonus = formatPattern.ctaConfidence * 5
  
  return Math.min(15, baseScore - 5 + confidenceBonus)
}

function calculateEmotionalScore(signals: ViralSignals): number {
  const triggerCount = signals.emotionalTriggers.length
  const baseScore = Math.min(10, triggerCount * 3)
  
  const strongEmotions = [
    EmotionalTrigger.CURIOSITY,
    EmotionalTrigger.SURPRISE,
    EmotionalTrigger.URGENCY
  ]
  
  const hasStrongEmotion = signals.emotionalTriggers.some(t => strongEmotions.includes(t))
  const strongEmotionBonus = hasStrongEmotion ? 5 : 0
  
  return Math.min(15, baseScore + strongEmotionBonus)
}

function calculateFormatScore(parsed: ParsedContent, platform: Platform): number {
  let score = 5
  
  if (platform === 'linkedin') {
    if (parsed.lineBreakStructure.totalLineBreaks >= 3) score += 2
    if (parsed.paragraphs.length >= 2) score += 2
    if (parsed.emojiCount >= 1 && parsed.emojiCount <= 5) score += 1
  } else {
    if (parsed.hasHashtags) score += 2
    if (parsed.emojiCount >= 1) score += 2
    if (parsed.wordCount <= 280) score += 1
  }
  
  return Math.min(10, score)
}

function calculatePlatformFitScore(parsed: ParsedContent, platform: Platform): number {
  let score = 5
  
  if (platform === 'linkedin') {
    if (parsed.wordCount >= 100 && parsed.wordCount <= 400) score += 3
    if (parsed.paragraphs.length >= 2) score += 2
  } else {
    if (parsed.wordCount <= 280) score += 3
    if (parsed.hasHashtags) score += 2
  }
  
  return Math.min(10, score)
}

function calculateOverallConfidence(
  formatPattern: DetectedFormatPattern,
  signals: ViralSignals
): number {
  const hookConfidence = formatPattern.hookConfidence
  const bodyConfidence = formatPattern.bodyConfidence
  const ctaConfidence = formatPattern.ctaConfidence
  const signalStrength = signals.viralityIndicators.reduce((sum, i) => sum + i.score, 0) / 
                         (signals.viralityIndicators.length * 100)
  
  return Math.round(
    ((hookConfidence + bodyConfidence + ctaConfidence) / 3 * 0.7 + signalStrength * 0.3) * 100
  ) / 100
}

function generateRecommendations(
  parsed: ParsedContent,
  formatPattern: DetectedFormatPattern,
  signals: ViralSignals,
  platform: Platform
): string[] {
  const recommendations: string[] = []
  
  if (formatPattern.hookType === HookType.NONE) {
    recommendations.push('Add a strong hook at the beginning to grab attention')
  }
  
  if (formatPattern.ctaType === CTAType.NONE) {
    recommendations.push('Include a clear call-to-action to drive engagement')
  }
  
  if (signals.emotionalTriggers.length === 0) {
    recommendations.push('Add emotional elements to increase shareability')
  }
  
  if (platform === 'linkedin' && parsed.lineBreakStructure.totalLineBreaks < 3) {
    recommendations.push('Add more line breaks for better readability on LinkedIn')
  }
  
  if (platform === 'twitter' && !parsed.hasHashtags) {
    recommendations.push('Consider adding relevant hashtags for discoverability')
  }
  
  if (!parsed.hasNumbers) {
    recommendations.push('Include specific numbers or statistics for credibility')
  }
  
  return recommendations
}

function findSimilarFormats(formatPattern: DetectedFormatPattern): string[] {
  const formatMap: Record<string, string[]> = {
    [`${HookType.QUESTION}_${BodyType.LISTICLE}`]: ['Q&A List Format', 'Numbered Answer Format'],
    [`${HookType.BOLD_STATEMENT}_${BodyType.STORY_DRIVEN}`]: ['Bold Story Opener', 'Controversial Story'],
    [`${HookType.STORY}_${BodyType.LESSON_LEARNED}`]: ['Personal Story Lesson', 'Failure-to-Success'],
    [`${HookType.LIST}_${BodyType.LISTICLE}`]: ['Pure Listicle', 'Numbered Tips'],
    [`${HookType.HOW_TO}_${BodyType.TUTORIAL}`]: ['Step-by-Step Guide', 'Tutorial Format']
  }
  
  const key = `${formatPattern.hookType}_${formatPattern.bodyType}`
  return formatMap[key] || ['General Viral Format', 'Engagement Optimized']
}