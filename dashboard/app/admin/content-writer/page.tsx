'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentFormat {
  id: string
  name: string
  description: string
  hookType: string
  bodyStructure: string
  ctaType: string
  template: string
  example: string
  platform: 'linkedin' | 'twitter' | 'both'
  effectivenessIndicators: string[]
  sourcePosts: string[]
  createdAt: string
}

interface AgentSkills {
  version: string
  formats: ContentFormat[]
  brandVoice: string
  targetAudience: string
  useCases: string[]
  updatedAt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type AnalyzeStep = 'idle' | 'starting' | 'scraping' | 'analyzing' | 'done' | 'error'

const HOOK_TYPES = ['BOLD_STATEMENT', 'QUESTION', 'PERSONAL_STORY', 'COUNTERINTUITIVE_TAKE', 'STATISTIC', 'HOW_TO', 'CONTROVERSIAL', 'LIST_PREVIEW', 'FAILURE_ADMISSION']
const BODY_STRUCTURES = ['NUMBERED_LIST', 'STORY_ARC', 'PROBLEM_SOLUTION', 'INSIGHT_DUMP', 'STEP_BY_STEP', 'COMPARISON', 'MYTH_BUSTING', 'LESSON_LEARNED', 'BEFORE_AFTER']
const CTA_TYPES = ['COMMENT_PROMPT', 'SAVE_FOR_LATER', 'FOLLOW_FOR_MORE', 'SHARE', 'SOFT_SELL', 'NO_CTA', 'AGREE_DISAGREE']

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bigzec-content-writer-skills'

const DEFAULT_SKILLS: AgentSkills = {
  version: '1.0',
  formats: [],
  brandVoice:
    'Professional yet conversational. Data-driven. Direct and confident. Thought leadership focused on AI + GTM.',
  targetAudience:
    'B2B founders, GTM leaders, revenue operators exploring AI-powered go-to-market tools.',
  useCases: [
    'AI agents for GTM teams',
    'B2B sales automation',
    'LinkedIn content strategy for SaaS',
    'BigZEC AI positioning',
  ],
  updatedAt: '',
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Hey Razvan! I'm your LinkedIn/𝕏 Content Writer Agent. Ready to create posts that actually perform.

Here's what I can do:
→ Write LinkedIn posts based on your use cases (using learned formats)
→ Create X (Twitter) threads and punchy single posts
→ Suggest hooks, angles, and variations
→ Adapt any topic to our brand voice

Tell me what you want to post about — or just describe the situation/result/idea and I'll take it from there.`,
  timestamp: new Date(),
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadSkills(): AgentSkills {
  if (typeof window === 'undefined') return DEFAULT_SKILLS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SKILLS, ...JSON.parse(raw) } : DEFAULT_SKILLS
  } catch {
    return DEFAULT_SKILLS
  }
}

function persistSkills(skills: AgentSkills): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...skills, updatedAt: new Date().toISOString() }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, color = 'gray' }: { label: string; color?: 'blue' | 'purple' | 'green' | 'gray' | 'orange' }) {
  const colors = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/15 text-green-400 border-green-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    gray: 'bg-gray-700/50 text-gray-300 border-gray-600/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${colors[color]}`}>
      {label}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function FormatCard({ format, onRemove }: { format: ContentFormat; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const hookColors: Record<string, 'blue' | 'purple' | 'orange' | 'green'> = {
    BOLD_STATEMENT: 'orange',
    QUESTION: 'blue',
    PERSONAL_STORY: 'purple',
    COUNTERINTUITIVE_TAKE: 'orange',
    STATISTIC: 'blue',
    FAILURE_ADMISSION: 'purple',
    HOW_TO: 'green',
    CONTROVERSIAL: 'orange',
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-semibold text-white">{format.name}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{format.description}</p>
          </div>
          <button
            onClick={onRemove}
            className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors"
            title="Remove format"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge label={format.hookType} color={hookColors[format.hookType] ?? 'blue'} />
          <Badge label={format.bodyStructure} color="purple" />
          <Badge label={format.ctaType} color="green" />
          <Badge label={format.platform} color="gray" />
        </div>
        {format.effectivenessIndicators.length > 0 && (
          <div className="text-xs text-gray-500">
            💡 {format.effectivenessIndicators.slice(0, 2).join(' · ')}
          </div>
        )}
      </div>
      {expanded && (
        <div className="border-t border-gray-700/50 p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Template</p>
            <pre className="text-xs text-gray-300 bg-black/40 rounded p-3 overflow-x-auto whitespace-pre-wrap font-mono">
              {format.template}
            </pre>
          </div>
          {format.example && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Example excerpt</p>
              <p className="text-xs text-gray-400 italic">"{format.example}"</p>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-300 border-t border-gray-700/50 transition-colors flex items-center justify-center gap-1"
      >
        {expanded ? 'Hide details' : 'Show template & example'}
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}

function FormatEditor({
  format,
  onSave,
  onCancel,
}: {
  format: ContentFormat
  onSave: (f: ContentFormat) => void
  onCancel: () => void
}) {
  const [edit, setEdit] = useState(format)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Name *</label>
        <input
          type="text"
          value={edit.name}
          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          placeholder="e.g. R.I.P. Obituary → AI Replacement"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Description *</label>
        <input
          type="text"
          value={edit.description}
          onChange={(e) => setEdit({ ...edit, description: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          placeholder="When to use this format..."
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Hook Type</label>
          <select
            value={edit.hookType}
            onChange={(e) => setEdit({ ...edit, hookType: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          >
            {HOOK_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Body Structure</label>
          <select
            value={edit.bodyStructure}
            onChange={(e) => setEdit({ ...edit, bodyStructure: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          >
            {BODY_STRUCTURES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">CTA Type</label>
          <select
            value={edit.ctaType}
            onChange={(e) => setEdit({ ...edit, ctaType: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          >
            {CTA_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Platform</label>
        <div className="flex gap-2">
          {(['linkedin', 'twitter', 'both'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setEdit({ ...edit, platform: p })}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                edit.platform === p
                  ? 'bg-white text-black border-white'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {p === 'twitter' ? '𝕏' : p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Template</label>
        <textarea
          value={edit.template}
          onChange={(e) => setEdit({ ...edit, template: e.target.value })}
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-gray-500 resize-none"
          placeholder="R.I.P [Traditional Method]&#10;&#10;[AI Tool] just [action verb] it.&#10;&#10;..."
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Example</label>
        <textarea
          value={edit.example}
          onChange={(e) => setEdit({ ...edit, example: e.target.value })}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gray-500 resize-none"
          placeholder="First 300 chars of a post using this format..."
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Effectiveness Indicators (one per line)</label>
        <textarea
          value={edit.effectivenessIndicators.join('\n')}
          onChange={(e) => setEdit({ ...edit, effectivenessIndicators: e.target.value.split('\n').filter(Boolean) })}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-gray-500 resize-none"
          placeholder="Obituary framing creates instant curiosity&#10;Specific metrics build credibility..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!edit.name.trim() || !edit.description.trim()) return
            onSave(edit)
          }}
          disabled={!edit.name.trim() || !edit.description.trim()}
          className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Format
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentWriterPage() {
  const [activeTab, setActiveTab] = useState<'learn' | 'manage' | 'create'>('learn')
  const [platform, setPlatform] = useState<'linkedin' | 'twitter'>('linkedin')
  const [agentSkills, setAgentSkills] = useState<AgentSkills>(DEFAULT_SKILLS)

  // Learn tab
  const [postUrls, setPostUrls] = useState('')
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeStep>('idle')
  const [analyzeError, setAnalyzeError] = useState('')
  const [analyzeLog, setAnalyzeLog] = useState('')
  const [extractedFormats, setExtractedFormats] = useState<ContentFormat[]>([])
  const [rawAnalysis, setRawAnalysis] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  // Manage tab
  const [editingFormat, setEditingFormat] = useState<ContentFormat | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [jsonImport, setJsonImport] = useState('')
  const [jsonImportError, setJsonImportError] = useState('')

  // Create tab
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [chatInput, setChatInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showSkillsPanel, setShowSkillsPanel] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  // Load skills from localStorage
  useEffect(() => {
    setAgentSkills(loadSkills())
  }, [])

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Analyze flow ────────────────────────────────────────────────────────────

  const pollStatus = useCallback(async (runId: string) => {
    try {
      const res = await fetch(`/api/agent/analyze/status?runId=${runId}`)
      const data = await res.json()

      if (!data.success && ['FAILED', 'TIMED-OUT', 'ABORTED'].includes(data.status ?? '')) {
        clearInterval(pollRef.current)
        setAnalyzeStep('error')
        setAnalyzeError(data.error ?? `Apify run ${data.status}`)
        return
      }

      if (data.status === 'SUCCEEDED' && data.posts) {
        clearInterval(pollRef.current)
        setAnalyzeLog(`Scraped ${data.postCount ?? data.posts.length} posts. Analyzing formats…`)
        setAnalyzeStep('analyzing')

        const extractRes = await fetch('/api/agent/analyze/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posts: data.posts }),
        })
        const extractData = await extractRes.json()

        if (extractData.success) {
          setExtractedFormats(extractData.formats ?? [])
          setRawAnalysis(extractData.rawAnalysis ?? '')
          setAnalyzeStep('done')
          setAnalyzeLog(extractData.message ?? 'Analysis complete')
        } else {
          setAnalyzeStep('error')
          setAnalyzeError(extractData.error ?? 'Format extraction failed')
        }
      }
    } catch {
      clearInterval(pollRef.current)
      setAnalyzeStep('error')
      setAnalyzeError('Lost connection during scrape. Try again.')
    }
  }, [])

  const handleAnalyze = async () => {
    const urls = postUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    if (urls.length === 0) return

    setAnalyzeStep('starting')
    setAnalyzeError('')
    setExtractedFormats([])
    setRawAnalysis('')
    setAnalyzeLog('Finding LinkedIn scraper on Apify…')

    try {
      const res = await fetch('/api/agent/analyze/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })
      const data = await res.json()

      if (!data.success) {
        setAnalyzeStep('error')
        setAnalyzeError(data.error ?? 'Failed to start')
        return
      }

      setAnalyzeLog(`Started scraping with ${data.actorId}. Waiting for results…`)
      setAnalyzeStep('scraping')

      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => pollStatus(data.runId), 5000)
    } catch {
      setAnalyzeStep('error')
      setAnalyzeError('Could not reach the analysis service. Check your API keys.')
    }
  }

  const handleSaveToSkills = () => {
    const newFormats = extractedFormats.filter(
      (f) => !agentSkills.formats.find((existing) => existing.id === f.id)
    )
    const updated: AgentSkills = {
      ...agentSkills,
      formats: [...agentSkills.formats, ...newFormats],
      updatedAt: new Date().toISOString(),
    }
    setAgentSkills(updated)
    persistSkills(updated)
    setAnalyzeStep('idle')
    setExtractedFormats([])
    setPostUrls('')
    setActiveTab('create')
  }

  const handleRemoveFormat = (formatId: string) => {
    const updated: AgentSkills = {
      ...agentSkills,
      formats: agentSkills.formats.filter((f) => f.id !== formatId),
    }
    setAgentSkills(updated)
    persistSkills(updated)
  }

  // ── Manage Skills ────────────────────────────────────────────────────────────

  const handleAddFormat = (format: ContentFormat) => {
    const updated: AgentSkills = {
      ...agentSkills,
      formats: [...agentSkills.formats, { ...format, createdAt: new Date().toISOString() }],
    }
    setAgentSkills(updated)
    persistSkills(updated)
    setIsAddingNew(false)
  }

  const handleUpdateFormat = (format: ContentFormat) => {
    const updated: AgentSkills = {
      ...agentSkills,
      formats: agentSkills.formats.map((f) => (f.id === format.id ? format : f)),
    }
    setAgentSkills(updated)
    persistSkills(updated)
    setEditingFormat(null)
  }

  const handleImportJson = () => {
    setJsonImportError('')
    try {
      let jsonStr = jsonImport.trim()
      // Try to extract JSON array
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        setJsonImportError('No JSON array found. Paste an array of format objects.')
        return
      }
      let arrayStr = jsonMatch[0]
      // Handle truncated JSON
      if (!arrayStr.trim().endsWith(']')) {
        let openBraces = 0, openBrackets = 0, inString = false, escape = false
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
        if (inString) arrayStr += '"'
        while (openBraces > 0) { arrayStr += '}'; openBraces-- }
        while (openBrackets > 0) { arrayStr += ']'; openBrackets-- }
      }
      const parsed = JSON.parse(arrayStr)
      if (!Array.isArray(parsed)) {
        setJsonImportError('Input must be an array of format objects.')
        return
      }
      const newFormats: ContentFormat[] = parsed.map((f: any, i: number) => ({
        id: f.id || `imported-${Date.now()}-${i}`,
        name: f.name || 'Untitled Format',
        description: f.description || '',
        hookType: f.hookType || 'BOLD_STATEMENT',
        bodyStructure: f.bodyStructure || 'PROBLEM_SOLUTION',
        ctaType: f.ctaType || 'COMMENT_PROMPT',
        template: f.template || '',
        example: f.example || '',
        platform: f.platform || 'linkedin',
        effectivenessIndicators: f.effectivenessIndicators || [],
        sourcePosts: f.sourcePosts || [],
        createdAt: new Date().toISOString(),
      }))
      const updated: AgentSkills = {
        ...agentSkills,
        formats: [...agentSkills.formats, ...newFormats],
      }
      setAgentSkills(updated)
      persistSkills(updated)
      setJsonImport('')
      setJsonImportError('')
    } catch (err) {
      setJsonImportError(`Parse error: ${err instanceof Error ? err.message : 'Invalid JSON'}`)
    }
  }

  // ── Chat flow ───────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = chatInput.trim()
    if (!text || isSending) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setIsSending(true)

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, skills: agentSkills, platform }),
      })
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: 'assistant',
          content: data.success ? data.message : `⚠️ ${data.error}`,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Something went wrong. Check your OPENROUTER_API_KEY and try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsSending(false)
      chatInputRef.current?.focus()
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const stepLabels: Record<AnalyzeStep, string> = {
    idle: '',
    starting: 'Connecting to Apify…',
    scraping: 'Scraping LinkedIn posts…',
    analyzing: 'Analyzing with z-ai/glm-5…',
    done: 'Analysis complete',
    error: 'Error',
  }

  const stepOrder: AnalyzeStep[] = ['starting', 'scraping', 'analyzing', 'done']
  const currentStepIdx = stepOrder.indexOf(analyzeStep)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              LinkedIn/𝕏 Content Writer
              <span className="text-xs font-normal px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-gray-400">
                z-ai/glm-5
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Learn winning formats · Generate high-performing posts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Skills indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
              agentSkills.formats.length > 0
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-gray-800/80 border-gray-700 text-gray-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${agentSkills.formats.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            {agentSkills.formats.length === 0
              ? 'No formats learned'
              : `${agentSkills.formats.length} format${agentSkills.formats.length !== 1 ? 's' : ''} in Skills`}
          </div>

          {/* Platform toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-gray-800/80 rounded-lg border border-gray-700">
            <button
              onClick={() => setPlatform('linkedin')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                platform === 'linkedin' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              LinkedIn
            </button>
            <button
              onClick={() => setPlatform('twitter')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                platform === 'twitter' ? 'bg-gray-900 text-white border border-gray-600' : 'text-gray-400 hover:text-white'
              }`}
            >
              𝕏 Twitter
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 flex border-b border-gray-800 px-8">
        {(['learn', 'manage', 'create'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-white text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'learn' ? '① Learn Formats' : tab === 'manage' ? '② Manage Skills' : '③ Create Content'}
          </button>
        ))}
      </div>

      {/* ── Learn Tab ── */}
      {activeTab === 'learn' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Instructions */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">How it works</h3>
              <ol className="space-y-1.5 text-sm text-gray-400">
                <li>1. Paste LinkedIn post URLs (one per line) that you want the agent to learn from</li>
                <li>2. The agent connects to Apify, finds a LinkedIn post scraper, and runs it</li>
                <li>3. Scraped posts are analyzed by z-ai/glm-5 to extract the format patterns</li>
                <li>4. Save the extracted formats to Agent Skills — used for all future content creation</li>
              </ol>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LinkedIn Post URLs
                <span className="ml-2 text-xs text-gray-500">(one per line)</span>
              </label>
              <textarea
                value={postUrls}
                onChange={(e) => setPostUrls(e.target.value)}
                placeholder={`https://www.linkedin.com/posts/example-post-1\nhttps://www.linkedin.com/posts/example-post-2\nhttps://www.linkedin.com/posts/example-post-3`}
                rows={6}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none font-mono"
                disabled={analyzeStep !== 'idle' && analyzeStep !== 'error'}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-600">
                  {postUrls.split('\n').filter((u) => u.trim()).length} URL
                  {postUrls.split('\n').filter((u) => u.trim()).length !== 1 ? 's' : ''} entered
                </span>
                <div className="flex gap-2">
                  {(analyzeStep === 'done' || analyzeStep === 'error') && (
                    <button
                      onClick={() => {
                        setAnalyzeStep('idle')
                        setAnalyzeError('')
                        setExtractedFormats([])
                        setRawAnalysis('')
                      }}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={!postUrls.trim() || (analyzeStep !== 'idle' && analyzeStep !== 'error')}
                    className="px-5 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {analyzeStep !== 'idle' && analyzeStep !== 'error' && analyzeStep !== 'done' ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analyzing…
                      </>
                    ) : (
                      'Analyze Posts'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            {analyzeStep !== 'idle' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  {analyzeStep === 'error' ? (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  ) : analyzeStep === 'done' ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-medium ${analyzeStep === 'error' ? 'text-red-400' : analyzeStep === 'done' ? 'text-green-400' : 'text-white'}`}>
                      {analyzeStep === 'error' ? analyzeError : analyzeStep === 'done' ? analyzeLog : stepLabels[analyzeStep]}
                    </p>
                    {analyzeLog && analyzeStep !== 'done' && analyzeStep !== 'error' && (
                      <p className="text-xs text-gray-500 mt-0.5">{analyzeLog}</p>
                    )}
                  </div>
                </div>

                {/* Step progress bar */}
                {analyzeStep !== 'error' && (
                  <div className="flex gap-2">
                    {stepOrder.map((step, i) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          i <= currentStepIdx ? 'bg-white' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Extracted Formats */}
            {extractedFormats.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    Extracted Format Patterns
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({extractedFormats.length} pattern{extractedFormats.length !== 1 ? 's' : ''} found)
                    </span>
                  </h3>
                  <button
                    onClick={handleSaveToSkills}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Save All to Agent Skills
                  </button>
                </div>
                <div className="space-y-3">
                  {extractedFormats.map((format) => (
                    <div
                      key={format.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{format.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{format.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge label={`Hook: ${format.hookType}`} color="blue" />
                        <Badge label={`Body: ${format.bodyStructure}`} color="purple" />
                        <Badge label={`CTA: ${format.ctaType}`} color="green" />
                      </div>
                      {format.effectivenessIndicators?.length > 0 && (
                        <p className="text-xs text-gray-500">
                          💡 {format.effectivenessIndicators.join(' · ')}
                        </p>
                      )}
                      {format.template && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">Template:</p>
                          <pre className="text-xs text-gray-300 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                            {format.template}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Analysis fallback */}
            {rawAnalysis && extractedFormats.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Raw Analysis Output</p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">{rawAnalysis}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Manage Tab ── */}
      {activeTab === 'manage' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Manage Agent Skills</h3>
                <p className="text-sm text-gray-500 mt-0.5">Add, edit, or import format patterns manually</p>
              </div>
              <button
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Format
              </button>
            </div>

            {/* JSON Import */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3">Import from JSON</h4>
              <p className="text-xs text-gray-400 mb-3">Paste the raw analysis output or a JSON array of formats to import</p>
              <textarea
                value={jsonImport}
                onChange={(e) => setJsonImport(e.target.value)}
                placeholder='[\n  {\n    "id": "format-slug",\n    "name": "Format Name",\n    "description": "...",\n    ...\n  }\n]'
                rows={6}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 resize-none font-mono"
              />
              {jsonImportError && (
                <p className="text-xs text-red-400 mt-2">{jsonImportError}</p>
              )}
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleImportJson}
                  disabled={!jsonImport.trim()}
                  className="px-4 py-2 text-sm font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Import Formats
                </button>
              </div>
            </div>

            {/* Existing Formats */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">
                Saved Formats ({agentSkills.formats.length})
              </h4>
              {agentSkills.formats.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 border border-gray-700/30 rounded-xl">
                  <p className="text-gray-500 text-sm">No formats saved yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Use the Learn tab or add formats manually above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agentSkills.formats.map((format) => (
                    <div key={format.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                      {editingFormat?.id === format.id ? (
                        <FormatEditor
                          format={editingFormat}
                          onSave={handleUpdateFormat}
                          onCancel={() => setEditingFormat(null)}
                        />
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-sm font-semibold text-white">{format.name}</h5>
                            <p className="text-xs text-gray-400 mt-0.5">{format.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge label={format.hookType} color="orange" />
                              <Badge label={format.bodyStructure} color="purple" />
                              <Badge label={format.ctaType} color="green" />
                              <Badge label={format.platform} color="gray" />
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingFormat(format)}
                              className="text-gray-500 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemoveFormat(format.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Format Modal */}
            {isAddingNew && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h4 className="text-sm font-semibold text-white">Add New Format</h4>
                    <button onClick={() => setIsAddingNew(false)} className="text-gray-500 hover:text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="overflow-y-auto p-4">
                    <FormatEditor
                      format={{
                        id: `manual-${Date.now()}`,
                        name: '',
                        description: '',
                        hookType: 'BOLD_STATEMENT',
                        bodyStructure: 'PROBLEM_SOLUTION',
                        ctaType: 'COMMENT_PROMPT',
                        template: '',
                        example: '',
                        platform: 'linkedin',
                        effectivenessIndicators: [],
                        sourcePosts: [],
                        createdAt: new Date().toISOString(),
                      }}
                      onSave={handleAddFormat}
                      onCancel={() => setIsAddingNew(false)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Tab ── */}
      {activeTab === 'create' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                      <span className="text-black font-bold text-xs">Z</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] ${
                      msg.role === 'user'
                        ? 'bg-white text-black rounded-2xl rounded-tr-sm px-4 py-3'
                        : 'bg-gray-800/80 border border-gray-700/50 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && msg.content.length > 100 && (
                      <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-end">
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mr-3">
                    <span className="text-black font-bold text-xs">Z</span>
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 px-6 pb-5">
              {agentSkills.formats.length === 0 && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No formats in Skills yet.{' '}
                  <button onClick={() => setActiveTab('learn')} className="underline hover:no-underline">
                    Learn from LinkedIn posts first
                  </button>{' '}
                  for best results.
                </div>
              )}
              <div className="flex gap-3 items-end bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="What do you want to post about? Describe your idea, use case, or result…"
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isSending}
                  className="flex-shrink-0 p-2.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>

          {/* Skills Panel */}
          {showSkillsPanel && (
            <div className="w-72 flex-shrink-0 border-l border-gray-800 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agent Skills</h3>
                <div className="flex items-center gap-2">
                  {agentSkills.formats.length > 0 && (
                    <span className="text-xs text-gray-500">{agentSkills.formats.length} formats</span>
                  )}
                  <button
                    onClick={() => setShowSkillsPanel(false)}
                    className="text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {agentSkills.formats.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="text-3xl mb-3">🧠</div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      No formats learned yet. Go to the{' '}
                      <button
                        onClick={() => setActiveTab('learn')}
                        className="text-gray-400 underline hover:no-underline"
                      >
                        Learn tab
                      </button>{' '}
                      and analyze some high-performing LinkedIn posts.
                    </p>
                  </div>
                ) : (
                  agentSkills.formats.map((format) => (
                    <FormatCard
                      key={format.id}
                      format={format}
                      onRemove={() => handleRemoveFormat(format.id)}
                    />
                  ))
                )}
              </div>

              {/* Brand Voice */}
              <div className="flex-shrink-0 border-t border-gray-800 p-3">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Brand Voice</p>
                <p className="text-xs text-gray-400 leading-relaxed">{agentSkills.brandVoice}</p>
              </div>
            </div>
          )}

          {/* Show panel toggle when hidden */}
          {!showSkillsPanel && (
            <button
              onClick={() => setShowSkillsPanel(true)}
              className="flex-shrink-0 w-9 border-l border-gray-800 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-400 transition-colors"
              title="Show Agent Skills"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-xs -rotate-90 whitespace-nowrap mt-2">Skills</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
