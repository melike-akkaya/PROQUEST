function safeText(value) {
  return (value ?? '').toString().trim();
}

export function buildConversationAwareQuestion(messages, latestQuestion) {
  const cleanedQuestion = safeText(latestQuestion);
  const history = messages
    .filter((message) => message.includeInContext !== false)
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-6)
    .map((message) => {
      const roleLabel = message.role === 'user' ? 'User' : 'Assistant';
      return `${roleLabel}: ${safeText(message.content)}`;
    })
    .join('\n');

  if (!history) {
    return cleanedQuestion;
  }

  return [
    'Continue the following protein-analysis conversation.',
    'Use prior turns only as supporting context and prioritize the newest user request.',
    '',
    'Conversation history:',
    history,
    '',
    'Newest user request:',
    cleanedQuestion,
  ].join('\n');
}

export function buildSuggestedFollowUps({ question, answer, proteinInfo = [], sequence = '' }) {
  const normalizedQuestion = safeText(question).toLowerCase();
  const normalizedAnswer = safeText(answer).toLowerCase();
  const topProtein = proteinInfo[0]?.['Protein ID'];
  const suggestions = [];

  if (topProtein) {
    suggestions.push(`Can you compare the top hits against ${topProtein}?`);
    suggestions.push(`Which annotations make ${topProtein} relevant here?`);
  }

  if (sequence.trim()) {
    suggestions.push('If we focus on the provided sequence, which motifs or domains matter most?');
  }

  if (normalizedQuestion.includes('disease') || normalizedAnswer.includes('disease')) {
    suggestions.push('Which pathways or biological processes connect these proteins to the disease?');
  }

  if (normalizedQuestion.includes('interact') || normalizedAnswer.includes('interact')) {
    suggestions.push('Which interaction partners are the strongest follow-up leads?');
  }

  if (normalizedQuestion.includes('function') || normalizedAnswer.includes('function')) {
    suggestions.push('Can you break this down into molecular function, process, and localization?');
  }

  suggestions.push('Which retrieved proteins should I inspect first and why?');
  suggestions.push('Can you narrow this to the most reliable UniProt evidence?');

  return [...new Set(suggestions)].slice(0, 4);
}

export function formatApiError(error) {
  if (typeof error?.response?.data === 'string') {
    return error.response.data;
  }

  if (typeof error?.response?.data?.detail === 'string') {
    return error.response.data.detail;
  }

  return error?.message || 'Unexpected error';
}

export function normalizeSequenceInput(sequence) {
  return sequence
    .trim()
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('>'))
    .join('')
    .replace(/\s+/g, '');
}

export function downloadCsv(filename, rows) {
  if (!rows?.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => `"${(row[header] ?? '').toString().replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
