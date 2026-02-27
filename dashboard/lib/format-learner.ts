/**
 * Format Learning System
 * 
 * This module provides the ability to learn from successful viral posts
 * and store their format patterns for future content generation.
 * 
 * The system learns by:
 * 1. Extracting format patterns from analyzed posts
 * 2. Storing successful patterns with effectiveness scores
 * 3. Finding best matching formats for new topics
 * 4. Suggesting format modifications for better results
 */

import {
  ViralPost,
  FormatPattern,
  AnalysisResult,
  FormatMatchResult,
  LearningData,
  Platform,
  HookType,
  BodyType,
  CTAType,
  EmotionalTrigger
} from './types/social-media'
import { analyzePost, parsePostContent, identifyFormatPattern, extractViralSignals } from './viral-analyzer'

let formatStore: Map<string, FormatPattern> = new Map()

/**
 * Learns from a viral post and stores its format pattern.
 * Extracts the successful format structure and stores it with
 * effectiveness metrics for future content generation.
 * 
 * @param post - ViralPost to learn from
 * @param analysisResult - Optional pre-computed analysis result
 * @returns The created or updated FormatPattern
 * 
 * @example
 * const format = await learnFromPost(viralPost, analysisResult)
 * // Returns stored format pattern with calculated effectiveness
 */
export function learnFromPost(
  post: ViralPost,
  analysisResult?: AnalysisResult
): FormatPattern {
  const analysis = analysisResult || analyzePost(post)
  const parsed = parsePostContent(post.content)
  
  const formatId = generateFormatId(analysis.formatPattern, post.platform)
  
  const existingFormat = formatStore.get(formatId)
  
  if (existingFormat) {
    const updatedFormat: FormatPattern = {
      ...existingFormat,
      effectivenessScore: calculateUpdatedEffectiveness(
        existingFormat.effectivenessScore,
        analysis.viralityScore,
        existingFormat.usageCount
      ),
      usageCount: existingFormat.usageCount + 1,
      updatedAt: new Date().toISOString()
    }
    
    formatStore.set(formatId, updatedFormat)
    return updatedFormat
  }
  
  const template = generateTemplate(post.content, analysis.formatPattern)
  const newFormat: FormatPattern = {
    id: formatId,
    name: generateFormatName(analysis.formatPattern),
    description: generateFormatDescription(analysis.formatPattern, post.platform),
    platform: post.platform,
    hookType: analysis.formatPattern.hookType,
    bodyType: analysis.formatPattern.bodyType,
    ctaType: analysis.formatPattern.ctaType,
    template,
    examplePost: post.content,
    tags: extractTags(post.content, analysis),
    effectivenessScore: analysis.viralityScore,
    usageCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  formatStore.set(formatId, newFormat)
  return newFormat
}

/**
 * Retrieves all stored format patterns, optionally filtered by platform.
 * 
 * @param platform - Optional platform filter
 * @returns Array of FormatPattern objects
 * 
 * @example
 * const linkedinFormats = getStoredFormats('linkedin')
 * // Returns all LinkedIn format patterns
 */
export function getStoredFormats(platform?: Platform): FormatPattern[] {
  const formats = Array.from(formatStore.values())
  
  if (platform) {
    return formats.filter(f => f.platform === platform)
  }
  
  return formats.sort((a, b) => b.effectivenessScore - a.effectivenessScore)
}

/**
 * Retrieves a specific format by ID.
 * 
 * @param id - Format pattern ID
 * @returns FormatPattern or undefined if not found
 */
export function getFormatById(id: string): FormatPattern | undefined {
  return formatStore.get(id)
}

/**
 * Finds the best matching format pattern for a given topic and context.
 * Analyzes the topic keywords, desired emotional triggers, and platform
 * to recommend the most effective format.
 * 
 * @param topic - Topic or theme for content
 * @param platform - Target platform
 * @param options - Additional matching options
 * @returns FormatMatchResult with best matching format
 * 
 * @example
 * const match = findBestMatch('leadership tips', 'linkedin', {
 *   preferredHook: HookType.LIST,
 *   targetEmotions: [EmotionalTrigger.INSPIRATION]
 * })
 */
export function findBestMatch(
  topic: string,
  platform: Platform,
  options?: {
    preferredHook?: HookType
    preferredBody?: BodyType
    preferredCTA?: CTAType
    targetEmotions?: EmotionalTrigger[]
    minEffectiveness?: number
  }
): FormatMatchResult | null {
  const formats = getStoredFormats(platform)
  
  if (formats.length === 0) {
    return getDefaultFormat(topic, platform)
  }
  
  let bestMatch: { format: FormatPattern; score: number; elements: string[] } | null = null
  
  for (const format of formats) {
    const { score, matchingElements } = calculateMatchScore(format, topic, options)
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        format,
        score,
        elements: matchingElements
      }
    }
  }
  
  if (!bestMatch) {
    return getDefaultFormat(topic, platform)
  }
  
  return {
    formatId: bestMatch.format.id,
    formatName: bestMatch.format.name,
    matchScore: bestMatch.score,
    matchingElements: bestMatch.elements,
    suggestedModifications: generateModifications(bestMatch.format, topic, options)
  }
}

/**
 * Updates an existing format pattern.
 * 
 * @param id - Format ID to update
 * @param updates - Partial format updates
 * @returns Updated FormatPattern or null if not found
 */
export function updateFormat(
  id: string,
  updates: Partial<Omit<FormatPattern, 'id' | 'createdAt'>>
): FormatPattern | null {
  const existing = formatStore.get(id)
  
  if (!existing) {
    return null
  }
  
  const updated: FormatPattern = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  formatStore.set(id, updated)
  return updated
}

/**
 * Deletes a format pattern from storage.
 * 
 * @param id - Format ID to delete
 * @returns true if deleted, false if not found
 */
export function deleteFormat(id: string): boolean {
  return formatStore.delete(id)
}

/**
 * Gets learning data for a specific format, including statistics
 * on successful posts and optimal parameters.
 * 
 * @param formatId - Format ID
 * @returns LearningData or null if format not found
 */
export function getLearningData(formatId: string): LearningData | null {
  const format = formatStore.get(formatId)
  
  if (!format) {
    return null
  }
  
  return {
    formatId: format.id,
    successfulPosts: [],
    averageEngagement: format.effectivenessScore,
    commonElements: extractCommonElements(format),
    optimalPostLength: calculateOptimalLength(format.platform),
    bestPerformingTopics: format.tags
  }
}

/**
 * Batch learns from multiple posts at once.
 * Useful for initial training or bulk updates.
 * 
 * @param posts - Array of ViralPost objects
 * @returns Array of created/updated FormatPattern objects
 */
export function batchLearn(posts: ViralPost[]): FormatPattern[] {
  return posts.map(post => learnFromPost(post))
}

/**
 * Exports all stored formats for backup or migration.
 * 
 * @returns JSON-serializable array of formats
 */
export function exportFormats(): FormatPattern[] {
  return Array.from(formatStore.values())
}

/**
 * Imports formats from an exported backup.
 * Merges with existing formats, updating effectiveness scores.
 * 
 * @param formats - Array of FormatPattern to import
 * @param mergeStrategy - How to handle conflicts: 'replace' | 'merge' | 'skip'
 */
export function importFormats(
  formats: FormatPattern[],
  mergeStrategy: 'replace' | 'merge' | 'skip' = 'merge'
): void {
  for (const format of formats) {
    const existing = formatStore.get(format.id)
    
    if (!existing) {
      formatStore.set(format.id, format)
    } else if (mergeStrategy === 'replace') {
      formatStore.set(format.id, format)
    } else if (mergeStrategy === 'merge') {
      const merged: FormatPattern = {
        ...existing,
        effectivenessScore: (existing.effectivenessScore + format.effectivenessScore) / 2,
        usageCount: existing.usageCount + format.usageCount,
        tags: [...new Set([...existing.tags, ...format.tags])],
        updatedAt: new Date().toISOString()
      }
      formatStore.set(format.id, merged)
    }
  }
}

/**
 * Clears all stored formats.
 * Use with caution - this is destructive.
 */
export function clearFormats(): void {
  formatStore.clear()
}

/**
 * Gets format statistics for analytics.
 * 
 * @param platform - Optional platform filter
 */
export function getFormatStats(platform?: Platform): {
  totalFormats: number
  averageEffectiveness: number
  topHooks: { hook: HookType; count: number }[]
  topBodies: { body: BodyType; count: number }[]
  topCTAs: { cta: CTAType; count: number }[]
} {
  const formats = getStoredFormats(platform)
  
  const hookCounts = new Map<HookType, number>()
  const bodyCounts = new Map<BodyType, number>()
  const ctaCounts = new Map<CTAType, number>()
  
  for (const format of formats) {
    hookCounts.set(format.hookType, (hookCounts.get(format.hookType) || 0) + 1)
    bodyCounts.set(format.bodyType, (bodyCounts.get(format.bodyType) || 0) + 1)
    ctaCounts.set(format.ctaType, (ctaCounts.get(format.ctaType) || 0) + 1)
  }
  
  const topHooks = Array.from(hookCounts.entries())
    .map(([hook, count]) => ({ hook, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  const topBodies = Array.from(bodyCounts.entries())
    .map(([body, count]) => ({ body, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  const topCTAs = Array.from(ctaCounts.entries())
    .map(([cta, count]) => ({ cta, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return {
    totalFormats: formats.length,
    averageEffectiveness: formats.length > 0
      ? formats.reduce((sum, f) => sum + f.effectivenessScore, 0) / formats.length
      : 0,
    topHooks,
    topBodies,
    topCTAs
  }
}

function generateFormatId(formatPattern: { hookType: HookType; bodyType: BodyType; ctaType: CTAType }, platform: Platform): string {
  const hash = `${platform}-${formatPattern.hookType}-${formatPattern.bodyType}-${formatPattern.ctaType}`
  return hash.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

function generateFormatName(formatPattern: { hookType: HookType; bodyType: BodyType; ctaType: CTAType }): string {
  const hookNames: Record<HookType, string> = {
    [HookType.QUESTION]: 'Question Hook',
    [HookType.BOLD_STATEMENT]: 'Bold Statement',
    [HookType.STORY]: 'Story Opener',
    [HookType.LIST]: 'List Intro',
    [HookType.CONTROVERSIAL_TAKE]: 'Controversial',
    [HookType.STATISTIC]: 'Data-Led',
    [HookType.QUOTE]: 'Quote-Led',
    [HookType.HOW_TO]: 'How-To',
    [HookType.NONE]: 'Direct'
  }
  
  const bodyNames: Record<BodyType, string> = {
    [BodyType.PROBLEM_SOLUTION]: 'Problem-Solution',
    [BodyType.STORY_DRIVEN]: 'Story-Driven',
    [BodyType.LISTICLE]: 'Listicle',
    [BodyType.TUTORIAL]: 'Tutorial',
    [BodyType.INSIGHT_SHARING]: 'Insight',
    [BodyType.COMPARISON]: 'Comparison',
    [BodyType.MYTH_BUSTING]: 'Myth-Buster',
    [BodyType.LESSON_LEARNED]: 'Lesson',
    [BodyType.THREAD]: 'Thread',
    [BodyType.NARRATIVE]: 'Narrative'
  }
  
  return `${hookNames[formatPattern.hookType]} ${bodyNames[formatPattern.bodyType]}`
}

function generateFormatDescription(
  formatPattern: { hookType: HookType; bodyType: BodyType; ctaType: CTAType },
  platform: Platform
): string {
  const platformNote = platform === 'linkedin' 
    ? 'Optimized for LinkedIn professional audience.'
    : 'Optimized for Twitter/X engagement.'
  
  return `Format using ${formatPattern.hookType} hook with ${formatPattern.bodyType} structure and ${formatPattern.ctaType} call-to-action. ${platformNote}`
}

function generateTemplate(
  content: string,
  formatPattern: { hookType: HookType; bodyType: BodyType; ctaType: CTAType }
): string {
  const lines = content.split('\n').filter(l => l.trim())
  
  const templateParts: string[] = []
  
  if (lines.length > 0) {
    templateParts.push(`[HOOK: ${formatPattern.hookType.toUpperCase()}]`)
    templateParts.push('{First line - grab attention}')
    templateParts.push('')
    
    if (formatPattern.bodyType === BodyType.LISTICLE) {
      templateParts.push('[BODY: LIST FORMAT]')
      templateParts.push('1. {Point one}')
      templateParts.push('2. {Point two}')
      templateParts.push('3. {Point three}')
    } else if (formatPattern.bodyType === BodyType.PROBLEM_SOLUTION) {
      templateParts.push('[BODY: PROBLEM → SOLUTION]')
      templateParts.push('{Describe the problem}')
      templateParts.push('')
      templateParts.push('{Present the solution}')
    } else if (formatPattern.bodyType === BodyType.STORY_DRIVEN) {
      templateParts.push('[BODY: STORY]')
      templateParts.push('{Set the scene}')
      templateParts.push('')
      templateParts.push('{The conflict or challenge}')
      templateParts.push('')
      templateParts.push('{The resolution or insight}')
    } else {
      templateParts.push('[BODY: MAIN CONTENT]')
      templateParts.push('{Key insights and value}')
    }
    
    templateParts.push('')
    templateParts.push(`[CTA: ${formatPattern.ctaType.toUpperCase()}]`)
    templateParts.push('{Call to action}')
  }
  
  return templateParts.join('\n')
}

function extractTags(content: string, analysis: AnalysisResult): string[] {
  const tags: string[] = []
  const lowerContent = content.toLowerCase()
  
  const topicKeywords: Record<string, string[]> = {
    'entrepreneurship': ['startup', 'business', 'entrepreneur', 'founder', 'company'],
    'career': ['job', 'career', 'interview', 'resume', 'hiring', 'promotion'],
    'leadership': ['leader', 'management', 'team', 'manager', 'executive'],
    'technology': ['ai', 'tech', 'software', 'code', 'developer', 'automation'],
    'finance': ['money', 'invest', 'wealth', 'financial', 'income', 'revenue'],
    'productivity': ['productivity', 'habits', 'efficiency', 'time', 'focus'],
    'marketing': ['marketing', 'sales', 'growth', 'customer', 'brand'],
    'self-improvement': ['growth', 'mindset', 'success', 'goals', 'improve']
  }
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      tags.push(topic)
    }
  }
  
  for (const trigger of analysis.viralSignals.emotionalTriggers) {
    tags.push(trigger.toString())
  }
  
  return [...new Set(tags)].slice(0, 10)
}

function calculateUpdatedEffectiveness(
  currentScore: number,
  newScore: number,
  usageCount: number
): number {
  const weight = Math.min(0.3, 1 / (usageCount + 1))
  return currentScore * (1 - weight) + newScore * weight
}

function calculateMatchScore(
  format: FormatPattern,
  topic: string,
  options?: {
    preferredHook?: HookType
    preferredBody?: BodyType
    preferredCTA?: CTAType
    targetEmotions?: EmotionalTrigger[]
    minEffectiveness?: number
  }
): { score: number; matchingElements: string[] } {
  let score = format.effectivenessScore / 100 * 40
  const matchingElements: string[] = []
  
  const lowerTopic = topic.toLowerCase()
  const matchingTags = format.tags.filter(tag => 
    lowerTopic.includes(tag.toLowerCase()) || 
    tag.toLowerCase().includes(lowerTopic.split(' ')[0])
  )
  score += matchingTags.length * 10
  matchingElements.push(...matchingTags.map(t => `Topic match: ${t}`))
  
  if (options?.preferredHook && format.hookType === options.preferredHook) {
    score += 15
    matchingElements.push('Preferred hook type')
  }
  
  if (options?.preferredBody && format.bodyType === options.preferredBody) {
    score += 15
    matchingElements.push('Preferred body structure')
  }
  
  if (options?.preferredCTA && format.ctaType === options.preferredCTA) {
    score += 10
    matchingElements.push('Preferred CTA type')
  }
  
  if (options?.targetEmotions) {
    const emotionMatches = options.targetEmotions.filter(e => 
      format.tags.includes(e.toString())
    )
    score += emotionMatches.length * 8
    matchingElements.push(...emotionMatches.map(e => `Emotion match: ${e}`))
  }
  
  if (options?.minEffectiveness && format.effectivenessScore < options.minEffectiveness) {
    score *= 0.5
  }
  
  score += Math.min(format.usageCount * 2, 10)
  
  return { score: Math.min(100, score), matchingElements }
}

function generateModifications(
  format: FormatPattern,
  topic: string,
  options?: {
    preferredHook?: HookType
    preferredBody?: BodyType
    preferredCTA?: CTAType
    targetEmotions?: EmotionalTrigger[]
  }
): string[] {
  const modifications: string[] = []
  
  if (options?.preferredHook && format.hookType !== options.preferredHook) {
    modifications.push(`Consider switching to ${options.preferredHook} hook for better alignment`)
  }
  
  if (options?.preferredCTA && format.ctaType !== options.preferredCTA) {
    modifications.push(`Try ${options.preferredCTA} CTA for higher engagement`)
  }
  
  if (options?.targetEmotions && options.targetEmotions.length > 0) {
    const missingEmotions = options.targetEmotions.filter(e => !format.tags.includes(e.toString()))
    if (missingEmotions.length > 0) {
      modifications.push(`Add ${missingEmotions[0]} emotional elements`)
    }
  }
  
  return modifications
}

function getDefaultFormat(topic: string, platform: Platform): FormatMatchResult {
  const defaultFormat: FormatPattern = {
    id: `default-${platform}`,
    name: 'Default Viral Format',
    description: 'A balanced format suitable for most content types',
    platform,
    hookType: HookType.QUESTION,
    bodyType: BodyType.INSIGHT_SHARING,
    ctaType: CTAType.QUESTION_TO_AUDIENCE,
    template: `[HOOK: QUESTION]
{Ask a compelling question related to ${topic}}

[BODY: INSIGHT]
{Share your key insight or perspective}
{Support with examples or data}

[CTA: QUESTION]
{Ask the audience for their thoughts}`,
    examplePost: '',
    tags: [topic],
    effectivenessScore: 50,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  if (!formatStore.has(defaultFormat.id)) {
    formatStore.set(defaultFormat.id, defaultFormat)
  }
  
  return {
    formatId: defaultFormat.id,
    formatName: defaultFormat.name,
    matchScore: 30,
    matchingElements: ['Default fallback format'],
    suggestedModifications: ['Add more specific formats by learning from successful posts']
  }
}

function extractCommonElements(format: FormatPattern): string[] {
  const elements: string[] = []
  
  elements.push(`Hook: ${format.hookType}`)
  elements.push(`Body: ${format.bodyType}`)
  elements.push(`CTA: ${format.ctaType}`)
  
  if (format.template.includes('1.')) {
    elements.push('numbered-lists')
  }
  if (format.template.includes('?')) {
    elements.push('questions')
  }
  
  return elements
}

function calculateOptimalLength(platform: Platform): { min: number; max: number; optimal: number } {
  if (platform === 'linkedin') {
    return { min: 150, max: 400, optimal: 250 }
  }
  return { min: 50, max: 280, optimal: 150 }
}

export function initializeDefaultFormats(): void {
  const defaultFormats: FormatPattern[] = [
    {
      id: 'linkedin-question-listicle',
      name: 'Question Hook Listicle',
      description: 'Opens with a question, delivers value through a numbered list',
      platform: 'linkedin',
      hookType: HookType.QUESTION,
      bodyType: BodyType.LISTICLE,
      ctaType: CTAType.SAVE_FOR_LATER,
      template: `[HOOK: QUESTION]
{Ask a specific question your audience faces}

[BODY: NUMBERED LIST]
1. {First valuable point}
2. {Second valuable point}
3. {Third valuable point}

[CTA: SAVE]
Save this for later reference`,
      examplePost: '',
      tags: ['educational', 'value-driven'],
      effectivenessScore: 75,
      usageCount: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'linkedin-story-lesson',
      name: 'Story-Driven Lesson',
      description: 'Personal story that leads to a valuable lesson',
      platform: 'linkedin',
      hookType: HookType.STORY,
      bodyType: BodyType.LESSON_LEARNED,
      ctaType: CTAType.COMMENT_PROMPT,
      template: `[HOOK: STORY]
{Set up the story with context}

[BODY: STORY + LESSON]
{Tell your story with the challenge}
{Share what you learned}

[CTA: COMMENT]
Have you experienced something similar? Share below.`,
      examplePost: '',
      tags: ['personal', 'relatable', 'story'],
      effectivenessScore: 80,
      usageCount: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'twitter-bold-insight',
      name: 'Bold Statement Insight',
      description: 'Controversial or bold opening that delivers valuable insight',
      platform: 'twitter',
      hookType: HookType.BOLD_STATEMENT,
      bodyType: BodyType.INSIGHT_SHARING,
      ctaType: CTAType.ENGAGEMENT_BAIT,
      template: `[HOOK: BOLD]
{Make a bold, attention-grabbing statement}

[BODY: INSIGHT]
{Back it up with insight}

[CTA: ENGAGEMENT]
RT if you agree 👇`,
      examplePost: '',
      tags: ['bold', 'controversial'],
      effectivenessScore: 70,
      usageCount: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  
  for (const format of defaultFormats) {
    if (!formatStore.has(format.id)) {
      formatStore.set(format.id, format)
    }
  }
}

initializeDefaultFormats()