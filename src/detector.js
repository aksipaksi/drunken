// AI/hype buzzword detection with word-boundary matching

// Word-boundary wrapper: match whole words only (case-insensitive)
// For short terms (AI, ML, NLP, AGI, RAG, LLM, GPT) use strict boundaries
// to avoid false positives in normal words
const PATTERNS = [
  // Core AI terms — strict word boundary
  /(?<![a-zA-Z])A\.?I\.?(?:-\w+)?(?![a-zA-Z])/g,
  /(?<![a-zA-Z])ML(?![a-zA-Z])/g,
  /(?<![a-zA-Z])LLM(?:s)?(?![a-zA-Z])/g,
  /(?<![a-zA-Z])GPT(?:-\w+)?(?![a-zA-Z])/g,
  /(?<![a-zA-Z])NLP(?![a-zA-Z])/g,
  /(?<![a-zA-Z])AGI(?![a-zA-Z])/g,
  /(?<![a-zA-Z])RAG(?![a-zA-Z])/g,
  /(?<![a-zA-Z])GenAI(?![a-zA-Z])/gi,

  // Longer terms — word boundary is enough
  /\bartificial\s+intelligence\b/gi,
  /\bmachine\s+learning\b/gi,
  /\bdeep\s+learning\b/gi,
  /\blarge\s+language\s+model(?:s)?\b/gi,
  /\bgenerative\s+ai\b/gi,
  /\bneural\s+network(?:s)?\b/gi,
  /\bcomputer\s+vision\b/gi,
  /\bautonomous\s+agent(?:s)?\b/gi,
  /\bprompt\s+engineering\b/gi,
  /\bfuture\s+of\s+work\b/gi,

  // Models & companies
  /\bChatGPT\b/gi,
  /\bOpenAI\b/gi,
  /\bAnthropic\b/gi,
  /\bClaude\b/gi,
  /\bCopilot\b/gi,
  /\bGemini\b/gi,
  /\bMidjourney\b/gi,
  /\bStable\s+Diffusion\b/gi,

  // LinkedIn buzzwords
  /\bvibe[\s-]?cod(?:ed|ing)\b/gi,
  /\bagentic\b/gi,
  /\bdisruptive\b/gi,
  /\bdisruption\b/gi,
  /\bgame[\s-]?changer\b/gi,
  /\btransformative\b/gi,
  /\b10x\b/gi,

  // Hashtags
  /#ArtificialIntelligence/gi,
  /#MachineLearning/gi,
  /#GenerativeAI/gi,
  /#DeepLearning/gi,
];

function countAIMentions(text) {
  let total = 0;
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) total += matches.length;
  }
  return total;
}

// Count mentions only in lines we haven't seen before.
// seenLines is a Set of normalized line strings.
// Returns { newCount, updatedSeen }.
function countNewAIMentions(text, seenLines) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let newCount = 0;
  const updatedSeen = new Set(seenLines);

  for (const line of lines) {
    if (updatedSeen.has(line)) continue;
    updatedSeen.add(line);
    newCount += countAIMentions(line);
  }

  // Cap the set size to prevent memory bloat — keep last ~500 lines
  if (updatedSeen.size > 1000) {
    const arr = Array.from(updatedSeen);
    const trimmed = arr.slice(arr.length - 500);
    return { newCount, updatedSeen: new Set(trimmed) };
  }

  return { newCount, updatedSeen };
}

module.exports = { countAIMentions, countNewAIMentions };
