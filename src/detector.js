// AI pattern detection with word-boundary matching
// Matches: AI, A.I., AI-powered, AI-driven, #AI, #ArtificialIntelligence, etc.
// Does NOT match: said, mail, fair, etc.

const AI_PATTERN = /(?<![a-zA-Z])(?:A\.?I\.?(?:-\w+)?)(?![a-zA-Z])|#ArtificialIntelligence/gi;

function countAIMentions(text) {
  const matches = text.match(AI_PATTERN);
  return matches ? matches.length : 0;
}

// Simple hash for dedup — detect unchanged screens
function hashText(text) {
  let hash = 0;
  const normalized = text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  return hash;
}

module.exports = { countAIMentions, hashText };
