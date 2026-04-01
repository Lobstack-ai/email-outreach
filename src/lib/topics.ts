// Canonical topic/niche definitions — shared across all discovery sources
// Each topic has: id, label, emoji, GitHub queries, PH topic slugs, HN keywords, LinkedIn keywords

export interface Topic {
  id:         string
  label:      string
  emoji:      string
  category:   string
  githubQ:    string[]   // GitHub search queries
  phTopics:   string[]   // Product Hunt topic slugs
  hnKeywords: string[]   // HN post keywords
  liKeywords: string[]   // LinkedIn search keywords
  description: string
}

export const TOPICS: Topic[] = [
  // ── AI Infrastructure ──────────────────────────────────────────────
  {
    id: 'ai-agents', label: 'AI Agents', emoji: '🤖', category: 'AI Infrastructure',
    description: 'Autonomous agent frameworks, multi-agent orchestration, agent runtimes',
    githubQ:    ['ai+agent+framework+stars:>20','autonomous+agents+production+stars:>10','multi+agent+orchestration+stars:>10'],
    phTopics:   ['artificial-intelligence','bots'],
    hnKeywords: ['ai agent','autonomous agent','multi-agent','agentic','agent framework'],
    liKeywords: ['AI agent platform','autonomous agent startup'],
  },
  {
    id: 'llm-infra', label: 'LLM Infrastructure', emoji: '⚡', category: 'AI Infrastructure',
    description: 'Model serving, inference, fine-tuning, LLMOps, model deployment',
    githubQ:    ['llm+inference+serving+stars:>50','llmops+monitoring+stars:>20','llm+deployment+platform+stars:>30'],
    phTopics:   ['artificial-intelligence','machine-learning'],
    hnKeywords: ['llm inference','model serving','llmops','fine-tuning','model deployment'],
    liKeywords: ['LLM infrastructure','model serving platform'],
  },
  {
    id: 'vector-db', label: 'Vector & RAG', emoji: '🔍', category: 'AI Infrastructure',
    description: 'Vector databases, embeddings, RAG pipelines, semantic search',
    githubQ:    ['vector+database+embeddings+stars:>100','rag+pipeline+retrieval+stars:>50','semantic+search+embeddings+stars:>30'],
    phTopics:   ['artificial-intelligence','developer-tools'],
    hnKeywords: ['vector database','rag','retrieval augmented','embeddings','semantic search'],
    liKeywords: ['vector database startup','RAG pipeline'],
  },
  {
    id: 'ai-memory', label: 'AI Memory', emoji: '🧠', category: 'AI Infrastructure',
    description: 'Persistent memory, context management, knowledge graphs for AI',
    githubQ:    ['ai+memory+persistence+stars:>10','agent+memory+knowledge+graph+stars:>10','context+management+llm+stars:>20'],
    phTopics:   ['artificial-intelligence'],
    hnKeywords: ['ai memory','persistent context','knowledge graph','agent memory'],
    liKeywords: ['AI memory platform','agent context management'],
  },
  {
    id: 'mcp-tools', label: 'MCP & Tools', emoji: '🔧', category: 'AI Infrastructure',
    description: 'MCP servers, tool use, function calling, AI tool integrations',
    githubQ:    ['mcp+tools+server+stars:>10','function+calling+tools+llm+stars:>20','model+context+protocol+stars:>5'],
    phTopics:   ['developer-tools','artificial-intelligence'],
    hnKeywords: ['mcp server','model context protocol','tool use','function calling'],
    liKeywords: ['MCP tools AI','AI tool integration'],
  },
  // ── Developer Tools ────────────────────────────────────────────────
  {
    id: 'ai-code', label: 'AI Coding', emoji: '💻', category: 'Developer Tools',
    description: 'AI code assistants, code generation, developer copilots',
    githubQ:    ['ai+code+assistant+stars:>50','code+generation+llm+stars:>100','ai+developer+copilot+stars:>30'],
    phTopics:   ['developer-tools','artificial-intelligence'],
    hnKeywords: ['ai coding','code assistant','code generation','developer ai','copilot'],
    liKeywords: ['AI coding assistant','code generation startup'],
  },
  {
    id: 'dev-ops-ai', label: 'AI DevOps', emoji: '🚀', category: 'Developer Tools',
    description: 'AI-powered CI/CD, infrastructure automation, DevOps intelligence',
    githubQ:    ['ai+workflow+automation+stars:>50','ai+devops+platform+stars:>30','llm+cicd+automation+stars:>20'],
    phTopics:   ['developer-tools'],
    hnKeywords: ['ai devops','infrastructure automation','ai cicd','platform engineering ai'],
    liKeywords: ['AI DevOps platform','infrastructure automation AI'],
  },
  {
    id: 'observability', label: 'AI Observability', emoji: '📊', category: 'Developer Tools',
    description: 'LLM monitoring, AI tracing, evaluation frameworks, guardrails',
    githubQ:    ['llm+monitoring+observability+stars:>30','ai+evaluation+testing+stars:>20','llm+guardrails+safety+stars:>20'],
    phTopics:   ['developer-tools','artificial-intelligence'],
    hnKeywords: ['llm monitoring','ai observability','model evaluation','llm tracing','ai guardrails'],
    liKeywords: ['LLM monitoring startup','AI observability'],
  },
  // ── Applied AI ─────────────────────────────────────────────────────
  {
    id: 'ai-data', label: 'AI + Data', emoji: '📈', category: 'Applied AI',
    description: 'AI analytics, data pipelines with ML, intelligent data tools',
    githubQ:    ['ai+data+pipeline+stars:>50','ml+data+platform+stars:>100','intelligent+analytics+llm+stars:>30'],
    phTopics:   ['artificial-intelligence','developer-tools'],
    hnKeywords: ['ai analytics','ml pipeline','data ai','intelligent data'],
    liKeywords: ['AI data platform','ML data pipeline startup'],
  },
  {
    id: 'ai-workflows', label: 'AI Workflows', emoji: '⚙️', category: 'Applied AI',
    description: 'Workflow automation, no-code AI builders, process automation',
    githubQ:    ['ai+workflow+builder+stars:>30','no+code+ai+automation+stars:>50','business+process+automation+ai+stars:>30'],
    phTopics:   ['artificial-intelligence','bots'],
    hnKeywords: ['ai workflow','workflow automation ai','no-code ai','process automation ai'],
    liKeywords: ['AI workflow automation','no-code AI platform'],
  },
  {
    id: 'ai-search', label: 'AI Search', emoji: '🔎', category: 'Applied AI',
    description: 'AI-powered search, knowledge bases, enterprise search with LLMs',
    githubQ:    ['ai+search+platform+stars:>50','knowledge+base+llm+stars:>30','enterprise+search+ai+stars:>30'],
    phTopics:   ['artificial-intelligence','developer-tools'],
    hnKeywords: ['ai search','knowledge base ai','enterprise search','llm search'],
    liKeywords: ['AI search platform startup'],
  },
  {
    id: 'voice-ai', label: 'Voice AI', emoji: '🎙️', category: 'Applied AI',
    description: 'Speech recognition, text-to-speech, voice agents, conversational AI',
    githubQ:    ['voice+ai+agent+stars:>30','speech+recognition+llm+stars:>50','text+to+speech+ai+stars:>50'],
    phTopics:   ['artificial-intelligence','bots'],
    hnKeywords: ['voice ai','speech ai','voice agent','tts','speech recognition ai'],
    liKeywords: ['voice AI startup','speech recognition AI'],
  },
  // ── Verticals ──────────────────────────────────────────────────────
  {
    id: 'ai-security', label: 'AI Security', emoji: '🔐', category: 'Verticals',
    description: 'AI-powered security, threat detection, compliance automation',
    githubQ:    ['ai+security+threat+detection+stars:>30','llm+security+scanning+stars:>20'],
    phTopics:   ['developer-tools'],
    hnKeywords: ['ai security','threat detection ai','compliance ai','llm security'],
    liKeywords: ['AI security startup','AI threat detection'],
  },
  {
    id: 'ai-finance', label: 'AI Finance', emoji: '💰', category: 'Verticals',
    description: 'Fintech AI, trading algorithms, financial analysis, fraud detection',
    githubQ:    ['ai+finance+trading+stars:>30','fintech+llm+analysis+stars:>20'],
    phTopics:   ['artificial-intelligence'],
    hnKeywords: ['ai finance','fintech ai','trading ai','financial ai','fraud detection ai'],
    liKeywords: ['AI fintech startup','financial AI platform'],
  },
  {
    id: 'ai-health', label: 'AI Healthcare', emoji: '🏥', category: 'Verticals',
    description: 'Medical AI, clinical decision support, health data intelligence',
    githubQ:    ['ai+healthcare+clinical+stars:>20','medical+llm+diagnosis+stars:>20'],
    phTopics:   ['artificial-intelligence'],
    hnKeywords: ['ai healthcare','medical ai','clinical ai','health ai'],
    liKeywords: ['AI healthcare startup','medical AI platform'],
  },
]

export const TOPIC_CATEGORIES = Array.from(new Set(TOPICS.map(t => t.category)))

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find(t => t.id === id)
}

export function buildGitHubQueries(topicIds: string[]): string[] {
  if (!topicIds.length) return TOPICS.flatMap(t => t.githubQ).slice(0, 15)
  const selected = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(selected.flatMap(t => t.githubQ))).slice(0, 15)
}

export function buildPHTopics(topicIds: string[]): string[] {
  if (!topicIds.length) return ['artificial-intelligence','developer-tools','machine-learning','bots']
  const selected = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(selected.flatMap(t => t.phTopics))).slice(0, 6)
}

export function buildHNKeywords(topicIds: string[]): string[] {
  if (!topicIds.length) return TOPICS.flatMap(t => t.hnKeywords).slice(0, 30)
  const selected = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(selected.flatMap(t => t.hnKeywords)))
}

export function buildLIKeywords(topicIds: string[]): string[] {
  if (!topicIds.length) return ['AI agent platform startup','LLM infrastructure startup']
  const selected = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(selected.flatMap(t => t.liKeywords))).slice(0, 4)
}
