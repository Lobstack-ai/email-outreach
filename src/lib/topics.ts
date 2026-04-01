export interface Topic {
  id: string; label: string; emoji: string; category: string; description: string
  githubQ: string[]; hnKeywords: string[]; liKeywords: string[]; ycTags: string[]
}

export const TOPICS: Topic[] = [
  // AI Infrastructure
  {id:'ai-agents',label:'AI Agents',emoji:'🤖',category:'AI Infrastructure',description:'Agent frameworks, multi-agent, runtimes',
   githubQ:['ai+agent+framework+stars:>20','autonomous+agents+production+stars:>10','multi+agent+orchestration+stars:>10'],
   hnKeywords:['ai agent','autonomous agent','multi-agent','agentic'],liKeywords:['AI agent platform startup'],ycTags:['Artificial Intelligence','AI']},
  {id:'llm-infra',label:'LLM Infrastructure',emoji:'⚡',category:'AI Infrastructure',description:'Model serving, inference, LLMOps',
   githubQ:['llm+inference+serving+stars:>50','llmops+monitoring+stars:>20','llm+deployment+platform+stars:>30'],
   hnKeywords:['llm inference','model serving','llmops','fine-tuning'],liKeywords:['LLM infrastructure startup'],ycTags:['Machine Learning','MLOps']},
  {id:'vector-db',label:'Vector & RAG',emoji:'🔍',category:'AI Infrastructure',description:'Vector DBs, embeddings, RAG pipelines',
   githubQ:['vector+database+embeddings+stars:>100','rag+pipeline+retrieval+stars:>50','semantic+search+embeddings+stars:>30'],
   hnKeywords:['vector database','rag','retrieval augmented','embeddings'],liKeywords:['vector database startup'],ycTags:['Developer Tools','Machine Learning']},
  {id:'ai-memory',label:'AI Memory',emoji:'🧠',category:'AI Infrastructure',description:'Persistent memory, context, knowledge graphs',
   githubQ:['ai+memory+persistence+stars:>10','agent+memory+knowledge+graph+stars:>10'],
   hnKeywords:['ai memory','persistent context','knowledge graph'],liKeywords:['AI memory platform'],ycTags:['Artificial Intelligence']},
  {id:'mcp-tools',label:'MCP & Tools',emoji:'🔧',category:'AI Infrastructure',description:'MCP servers, tool use, function calling',
   githubQ:['mcp+tools+server+stars:>10','function+calling+tools+llm+stars:>20','model+context+protocol+stars:>5'],
   hnKeywords:['mcp server','model context protocol','tool use'],liKeywords:['MCP tools AI'],ycTags:['Developer Tools','Artificial Intelligence']},

  // Developer Tools
  {id:'ai-code',label:'AI Coding',emoji:'💻',category:'Developer Tools',description:'Code assistants, copilots, code generation',
   githubQ:['ai+code+assistant+stars:>50','code+generation+llm+stars:>100','ai+developer+copilot+stars:>30'],
   hnKeywords:['ai coding','code assistant','code generation','developer ai'],liKeywords:['AI coding assistant startup'],ycTags:['Developer Tools','Artificial Intelligence']},
  {id:'dev-ops-ai',label:'AI DevOps',emoji:'🚀',category:'Developer Tools',description:'CI/CD automation, infrastructure AI',
   githubQ:['ai+workflow+automation+stars:>50','ai+devops+platform+stars:>30'],
   hnKeywords:['ai devops','infrastructure automation','ai cicd'],liKeywords:['AI DevOps platform'],ycTags:['Developer Tools','DevOps']},
  {id:'observability',label:'Observability',emoji:'📊',category:'Developer Tools',description:'LLM monitoring, evaluation, guardrails',
   githubQ:['llm+monitoring+observability+stars:>30','ai+evaluation+testing+stars:>20'],
   hnKeywords:['llm monitoring','ai observability','model evaluation'],liKeywords:['LLM monitoring startup'],ycTags:['Developer Tools','Machine Learning']},
  {id:'ai-testing',label:'AI Testing',emoji:'🧪',category:'Developer Tools',description:'Automated testing, QA, test generation',
   githubQ:['ai+testing+automation+stars:>30','llm+test+generation+stars:>20'],
   hnKeywords:['ai testing','automated qa','test generation ai'],liKeywords:['AI testing platform'],ycTags:['Developer Tools','B2B']},

  // Applied AI
  {id:'ai-data',label:'AI + Data',emoji:'📈',category:'Applied AI',description:'AI analytics, ML data pipelines, BI',
   githubQ:['ai+data+pipeline+stars:>50','ml+data+platform+stars:>100'],
   hnKeywords:['ai analytics','ml pipeline','data ai'],liKeywords:['AI data platform startup'],ycTags:['Data Engineering','Analytics']},
  {id:'ai-workflows',label:'AI Workflows',emoji:'⚙️',category:'Applied AI',description:'Workflow automation, no-code AI',
   githubQ:['ai+workflow+builder+stars:>30','no+code+ai+automation+stars:>50'],
   hnKeywords:['ai workflow','workflow automation ai','no-code ai'],liKeywords:['AI workflow automation startup'],ycTags:['Artificial Intelligence','Automation']},
  {id:'ai-search',label:'AI Search',emoji:'🔎',category:'Applied AI',description:'Enterprise search, knowledge bases',
   githubQ:['ai+search+platform+stars:>50','knowledge+base+llm+stars:>30'],
   hnKeywords:['ai search','knowledge base ai','enterprise search'],liKeywords:['AI search platform startup'],ycTags:['Search','Artificial Intelligence']},
  {id:'voice-ai',label:'Voice AI',emoji:'🎙️',category:'Applied AI',description:'Speech, TTS, conversational agents',
   githubQ:['voice+ai+agent+stars:>30','speech+recognition+llm+stars:>50'],
   hnKeywords:['voice ai','speech ai','voice agent','tts'],liKeywords:['voice AI startup'],ycTags:['AI Assistant','Consumer']},
  {id:'ai-robotics',label:'AI Robotics',emoji:'🦾',category:'Applied AI',description:'Robotics software, embodied AI',
   githubQ:['ai+robotics+software+stars:>20','embodied+ai+robot+stars:>20'],
   hnKeywords:['ai robotics','embodied ai','robot learning'],liKeywords:['AI robotics startup'],ycTags:['Robotics','Hardware']},

  // Fintech
  {id:'fintech-ai',label:'AI Fintech',emoji:'💳',category:'Fintech',description:'AI for banking, payments, lending',
   githubQ:['ai+fintech+banking+stars:>30','financial+ai+platform+stars:>20'],
   hnKeywords:['ai fintech','financial ai','banking ai','payment ai'],liKeywords:['AI fintech startup'],ycTags:['Fintech','Financial Services']},
  {id:'trading-ai',label:'Trading & Quant',emoji:'📉',category:'Fintech',description:'Algorithmic trading, quant finance AI',
   githubQ:['algorithmic+trading+ai+stars:>50','quant+finance+ml+stars:>30'],
   hnKeywords:['algorithmic trading ai','quant ai','trading bot ai'],liKeywords:['algorithmic trading AI startup'],ycTags:['Fintech','Machine Learning']},
  {id:'fraud-compliance',label:'Fraud & Compliance',emoji:'🛡️',category:'Fintech',description:'Fraud detection, AML, KYC, compliance AI',
   githubQ:['fraud+detection+ml+stars:>30','kyc+aml+ai+stars:>20'],
   hnKeywords:['fraud detection ai','aml ai','kyc automation','compliance ai'],liKeywords:['fraud detection AI startup'],ycTags:['Fintech','Compliance']},
  {id:'insurance-ai',label:'Insurtech AI',emoji:'📋',category:'Fintech',description:'Underwriting automation, claims AI',
   githubQ:['insurance+ai+underwriting+stars:>10','insurtech+ml+stars:>10'],
   hnKeywords:['insurance ai','insurtech','underwriting ai'],liKeywords:['insurtech AI startup'],ycTags:['Insurance']},

  // Crypto & Web3
  {id:'crypto-ai',label:'Crypto × AI',emoji:'🔗',category:'Crypto & Web3',description:'AI agents on-chain, blockchain intelligence',
   githubQ:['crypto+ai+agent+stars:>20','blockchain+ai+trading+stars:>30'],
   hnKeywords:['crypto ai','blockchain ai','defi ai','on-chain ai'],liKeywords:['crypto AI startup'],ycTags:['Crypto / Web3','Artificial Intelligence']},
  {id:'defi',label:'DeFi & Protocol',emoji:'⛓️',category:'Crypto & Web3',description:'DeFi protocols, DEX, stablecoins',
   githubQ:['defi+protocol+ethereum+stars:>100','decentralized+exchange+stars:>50'],
   hnKeywords:['defi protocol','decentralized finance','dex','amm'],liKeywords:['DeFi startup'],ycTags:['Crypto / Web3']},
  {id:'web3-infra',label:'Web3 Infrastructure',emoji:'🌐',category:'Crypto & Web3',description:'Blockchain infra, node services, wallet SDK',
   githubQ:['blockchain+infrastructure+sdk+stars:>50','web3+developer+tools+stars:>50'],
   hnKeywords:['web3 infrastructure','blockchain sdk','node provider'],liKeywords:['Web3 infrastructure startup'],ycTags:['Crypto / Web3','Developer Tools']},

  // eCommerce
  {id:'ecomm-ai',label:'eCommerce AI',emoji:'🛍️',category:'eCommerce',description:'AI for retail, recommendations, merchandising',
   githubQ:['ecommerce+ai+recommendation+stars:>30','retail+ai+personalization+stars:>20'],
   hnKeywords:['ecommerce ai','retail ai','product recommendation ai'],liKeywords:['ecommerce AI startup'],ycTags:['E-commerce','Retail']},
  {id:'supply-chain-ai',label:'Supply Chain AI',emoji:'📦',category:'eCommerce',description:'Logistics AI, inventory, demand forecasting',
   githubQ:['supply+chain+ai+optimization+stars:>20','logistics+ml+forecasting+stars:>20'],
   hnKeywords:['supply chain ai','logistics ai','demand forecasting ai'],liKeywords:['supply chain AI startup'],ycTags:['Supply Chain','Logistics']},

  // Healthcare
  {id:'ai-health',label:'AI Healthcare',emoji:'🏥',category:'Healthcare',description:'Medical AI, clinical decision support',
   githubQ:['ai+healthcare+clinical+stars:>20','medical+llm+diagnosis+stars:>20'],
   hnKeywords:['ai healthcare','medical ai','clinical ai','health ai'],liKeywords:['AI healthcare startup'],ycTags:['Healthcare','Digital Health']},
  {id:'biotech-ai',label:'BioTech AI',emoji:'🧬',category:'Healthcare',description:'Drug discovery, genomics, protein AI',
   githubQ:['drug+discovery+ai+stars:>30','protein+structure+ml+stars:>50'],
   hnKeywords:['drug discovery ai','genomics ai','biotech ai'],liKeywords:['biotech AI startup'],ycTags:['Healthcare','Biotech']},
  {id:'mental-health-ai',label:'Mental Health AI',emoji:'💚',category:'Healthcare',description:'AI therapy tools, wellness platforms',
   githubQ:['mental+health+ai+chatbot+stars:>20'],
   hnKeywords:['mental health ai','ai therapy','wellness ai'],liKeywords:['mental health AI startup'],ycTags:['Mental Health & Wellness']},

  // Enterprise SaaS
  {id:'sales-ai',label:'Sales AI',emoji:'💬',category:'Enterprise SaaS',description:'Sales automation, CRM intelligence, SDR AI',
   githubQ:['sales+ai+crm+automation+stars:>20','lead+scoring+ml+stars:>20'],
   hnKeywords:['sales ai','crm ai','sales automation ai'],liKeywords:['sales AI startup'],ycTags:['Sales','CRM','B2B']},
  {id:'hr-ai',label:'HR & Recruiting AI',emoji:'👥',category:'Enterprise SaaS',description:'AI recruiting, talent intelligence, HR automation',
   githubQ:['recruiting+ai+screening+stars:>20','hr+automation+ml+stars:>10'],
   hnKeywords:['recruiting ai','hr ai','talent ai','hiring ai'],liKeywords:['recruiting AI startup'],ycTags:['HR Tech','Recruiting']},
  {id:'legal-ai',label:'Legal AI',emoji:'⚖️',category:'Enterprise SaaS',description:'Contract analysis, legal research, compliance',
   githubQ:['legal+ai+contract+analysis+stars:>20','law+llm+research+stars:>20'],
   hnKeywords:['legal ai','contract ai','law ai'],liKeywords:['legal AI startup'],ycTags:['Legal']},
  {id:'marketing-ai',label:'Marketing AI',emoji:'📣',category:'Enterprise SaaS',description:'AI content, ad optimization, growth automation',
   githubQ:['marketing+ai+content+generation+stars:>30','ad+optimization+ml+stars:>20'],
   hnKeywords:['marketing ai','content generation ai','ad ai','seo ai'],liKeywords:['marketing AI startup'],ycTags:['Marketing','Advertising']},
  {id:'customer-support-ai',label:'Support AI',emoji:'🎧',category:'Enterprise SaaS',description:'AI customer service, support automation',
   githubQ:['customer+support+ai+chatbot+stars:>30','helpdesk+llm+automation+stars:>20'],
   hnKeywords:['customer support ai','support automation','helpdesk ai'],liKeywords:['customer support AI startup'],ycTags:['Customer Success','B2B']},

  // Security
  {id:'ai-security',label:'AI Security',emoji:'🔐',category:'Security',description:'Threat detection, SOC automation, AI pen testing',
   githubQ:['ai+security+threat+detection+stars:>30','llm+security+scanning+stars:>20'],
   hnKeywords:['ai security','threat detection ai','soc automation'],liKeywords:['AI security startup'],ycTags:['Security','B2B']},
  {id:'privacy-ai',label:'Privacy AI',emoji:'🔒',category:'Security',description:'Privacy-preserving AI, synthetic data, federated learning',
   githubQ:['privacy+preserving+ai+stars:>30','synthetic+data+generation+stars:>50'],
   hnKeywords:['privacy ai','synthetic data','federated learning'],liKeywords:['privacy AI startup'],ycTags:['Security','Privacy']},

  // Education
  {id:'edtech-ai',label:'EdTech AI',emoji:'📚',category:'Education',description:'AI tutoring, personalized learning, skill assessment',
   githubQ:['ai+tutoring+education+stars:>20','personalized+learning+llm+stars:>20'],
   hnKeywords:['ai tutoring','education ai','personalized learning ai'],liKeywords:['EdTech AI startup'],ycTags:['Education','Consumer']},
]

export const TOPIC_CATEGORIES = Array.from(new Set(TOPICS.map(t => t.category)))

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find(t => t.id === id)
}

export function buildGitHubQueries(topicIds: string[]): string[] {
  if (!topicIds.length) return TOPICS.flatMap(t => t.githubQ).slice(0, 15)
  const sel = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(sel.flatMap(t => t.githubQ))).slice(0, 15)
}

export function buildTopicTags(topicIds: string[]): string[] {
  if (!topicIds.length) return ['AI','Artificial Intelligence','Machine Learning','Developer Tools']
  const sel = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(sel.flatMap(t => t.ycTags))).slice(0, 8)
}

export function buildHNKeywords(topicIds: string[]): string[] {
  if (!topicIds.length) return TOPICS.flatMap(t => t.hnKeywords).slice(0, 30)
  const sel = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(sel.flatMap(t => t.hnKeywords)))
}

export function buildLIKeywords(topicIds: string[]): string[] {
  if (!topicIds.length) return ['AI agent platform startup','LLM infrastructure startup']
  const sel = topicIds.map(id => getTopicById(id)).filter(Boolean) as Topic[]
  return Array.from(new Set(sel.flatMap(t => t.liKeywords))).slice(0, 4)
}
