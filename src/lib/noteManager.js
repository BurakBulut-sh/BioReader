export function buildCitation(paper) {
  if (!paper) return 'Unknown et al. n.d.';
  const title = paper.title || '';
  const firstAuthor = title.split(' ')[0] || 'Unknown';
  const year = paper.year || new Date().getFullYear();
  return `${firstAuthor} et al. ${year}`;
}

export function detectSectionFromSelection(selectionText, pageText = '') {
  const lower = `${selectionText || ''} ${pageText || ''}`.toLowerCase();
  if (lower.includes('introduction')) return 'Introduction';
  if (lower.includes('materials and methods') || lower.includes('methods')) return 'Methods';
  if (lower.includes('results')) return 'Results';
  if (lower.includes('discussion')) return 'Discussion';
  if (lower.includes('conclusion')) return 'Conclusion';
  return 'Overview';
}

export function parseTags(input) {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 15);
}

export function noteTypeFromShortcut(action) {
  switch (action) {
    case 'quickNote':
      return 'quick';
    case 'deepNote':
      return 'deep';
    case 'questionNote':
      return 'question';
    case 'critiqueNote':
      return 'critique';
    case 'insightNote':
      return 'insight';
    default:
      return 'quick';
  }
}

export function groupNotesBySection(notes) {
  const map = new Map();
  for (const note of notes) {
    const key = note.section || `Page ${note.page ?? 'N/A'}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(note);
  }
  return Array.from(map.entries()).map(([section, items]) => ({
    section,
    items: items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
  }));
}

export function groupNotesByTopic(notes, noteTopics, topics) {
  const topicById = new Map(topics.map((topic) => [topic.id, { ...topic, notes: [] }]));
  const assignments = new Map();

  for (const item of noteTopics) {
    if (!assignments.has(item.note_id)) assignments.set(item.note_id, []);
    assignments.get(item.note_id).push(item.id);
  }

  for (const note of notes) {
    const topicIds = assignments.get(note.id) || [];
    for (const topicId of topicIds) {
      const topic = topicById.get(topicId);
      if (topic) topic.notes.push(note);
    }
  }

  return Array.from(topicById.values());
}
