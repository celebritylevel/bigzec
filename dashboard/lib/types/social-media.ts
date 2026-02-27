/**
 * Social Media Types for Viral Post Analysis and Format Learning
 * 
 * These types define the structure for analyzing viral social media posts
 * and learning from their format patterns to generate similar content.
 */

export type Platform = 'linkedin' | 'twitter'

export enum HookType {
  QUESTION = 'question',
  BOLD_STATEMENT = 'bold_statement',
  STORY = 'story',
  LIST = 'list',
  CONTROVERSIAL_TAKE = 'controversial_take',
  STATISTIC = 'statistic',
  QUOTE = 'quote',
  HOW_TO = 'how_to',
  NONE = 'none'
}

export enum BodyType {
  PROBLEM_SOLUTION = 'problem_solution',
  STORY_DRIVEN = 'story_driven',
  LISTICLE = 'listicle',
  TUTORIAL = 'tutorial',
  INSIGHT_SHARING = 'insight_sharing',
  COMPARISON = 'comparison',
  MYTH_BUSTING = 'myth_busting',
  LESSON_LEARNED = 'lesson_learned',
  THREAD = 'thread',
  NARRATIVE = 'narrative'
}

export enum CTAType {
  QUESTION_TO_AUDIENCE = 'question_to_audience',
  LINK = 'link',
  ENGAGEMENT_BAIT = 'engagement_bait',
  FOLLOW_UP = 'follow_up',
  SAVE_FOR_LATER = 'save_for_later',
  SHARE = 'share',
  COMMENT_PROMPT = 'comment_prompt',
  NONE = 'none'
}

export enum EmotionalTrigger {
  CURIOSITY = 'curiosity',
  FEAR = 'fear',
  EXCITEMENT = 'excitement',
  VALIDATION = 'validation',
  SURPRISE = 'surprise',
  ANGER = 'anger',
  NOSTALGIA = 'nostalgia',
  INSPIRATION = 'inspiration',
  FRUSTRATION = 'frustration',
  HOPE = 'hope',
  URGENCY = 'urgency',
  FOMO = 'fomo'
}

export interface ViralPost {
  id: string
  platform: Platform
  content: string
  author?: string
  url?: string
  metrics: PostMetrics
  createdAt: string
  analyzedAt?: string
}

export interface PostMetrics {
  likes: number
  comments: number
  shares: number
  saves?: number
  impressions?: number
  engagementRate?: number
}

export interface ParsedContent {
  original: string
  lines: string[]
  paragraphs: string[]
  wordCount: number
  characterCount: number
  hasEmoji: boolean
  emojiCount: number
  hasHashtags: boolean
  hashtags: string[]
  hasMentions: boolean
  mentions: string[]
  hasLinks: boolean
  links: string[]
  hasNumbers: boolean
  numbers: string[]
  capitalizationPatterns: CapitalizationPattern
  lineBreakStructure: LineBreakStructure
}

export interface CapitalizationPattern {
  hasAllCaps: boolean
  allCapsWords: string[]
  hasTitleCase: boolean
  averageWordLength: number
}

export interface LineBreakStructure {
  totalLineBreaks: number
  averageLineLength: number
  shortLines: number
  mediumLines: number
  longLines: number
  hasDoubleLineBreaks: boolean
}

export interface FormatPattern {
  id: string
  name: string
  description: string
  platform: Platform
  hookType: HookType
  bodyType: BodyType
  ctaType: CTAType
  template: string
  examplePost: string
  tags: string[]
  effectivenessScore: number
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface ViralSignals {
  emotionalTriggers: EmotionalTrigger[]
  formatElements: FormatElement[]
  timingSignals: TimingSignal[]
  topicRelevance: TopicRelevance[]
  viralityIndicators: ViralityIndicator[]
}

export interface FormatElement {
  type: string
  present: boolean
  count: number
  significance: 'high' | 'medium' | 'low'
}

export interface TimingSignal {
  type: string
  detected: boolean
  context: string
}

export interface TopicRelevance {
  topic: string
  relevanceScore: number
  trending: boolean
}

export interface ViralityIndicator {
  indicator: string
  score: number
  reason: string
}

export interface AnalysisResult {
  postId: string
  viralityScore: number
  confidence: number
  formatPattern: DetectedFormatPattern
  viralSignals: ViralSignals
  recommendations: string[]
  similarFormats: string[]
  analyzedAt: string
}

export interface DetectedFormatPattern {
  hookType: HookType
  hookConfidence: number
  hookText: string
  bodyType: BodyType
  bodyConfidence: number
  bodyStructure: string
  ctaType: CTAType
  ctaConfidence: number
  ctaText: string
}

export interface GeneratedContent {
  id: string
  platform: Platform
  content: string
  basedOnFormat: string
  topic: string
  generatedAt: string
  predictedViralityScore: number
  variations: ContentVariation[]
}

export interface ContentVariation {
  content: string
  hookType: HookType
  focusEmotion: EmotionalTrigger
}

export interface FormatMatchResult {
  formatId: string
  formatName: string
  matchScore: number
  matchingElements: string[]
  suggestedModifications: string[]
}

export interface LearningData {
  formatId: string
  successfulPosts: ViralPost[]
  averageEngagement: number
  commonElements: string[]
  optimalPostLength: { min: number; max: number; optimal: number }
  bestPerformingTopics: string[]
}