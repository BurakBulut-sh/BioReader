import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

function safeName(value) {
  return value.replace(/[^a-z0-9_-]+/gi, '_').replace(/_+/g, '_');
}

export function exportPaperToMarkdown({ paper, notes }) {
  const citation = `${paper?.title ?? 'Unknown'} (${paper?.year ?? 'n.d.'})`;
  const sections = new Map();

  for (const note of notes) {
    const key = note.section || `Page ${note.page ?? 'N/A'}`;
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key).push(note);
  }

  let md = `# ${citation}\n\n`;
  md += `- File: ${paper?.file_path ?? ''}\n`;
  md += `- Workflow: ${paper?.workflow_type ?? 'other'}\n`;
  md += `- Rating: ${paper?.rating ?? 0}/5\n\n`;

  for (const [section, sectionNotes] of sections.entries()) {
    md += `## ${section}\n\n`;
    for (const note of sectionNotes) {
      md += `### ${note.type.toUpperCase()}\n`;
      if (note.highlighted_text) {
        md += `> \"${note.highlighted_text}\"\n\n`;
      }
      md += `${note.note_text}\n\n`;
      md += `Tags: ${(note.tags || []).join(', ')}\n\n`;
    }
  }

  const filename = `${safeName((paper?.title || 'paper').slice(0, 60))}_notes.md`;
  return { filename, content: md, mime: 'text/markdown' };
}

export function exportPaperToBibtex({ paper }) {
  const authorList = Array.isArray(paper.authors)
    ? paper.authors
    : typeof paper.authors === 'string'
      ? paper.authors.split(/\s*,\s*|\s+and\s+/i)
      : [];
  const author = authorList[0]?.split(' ').at(-1) || 'Unknown';
  const authorString = Array.isArray(paper.authors) ? paper.authors.join(' and ') : (paper.authors || 'Unknown');
  const year = paper.year || new Date().getFullYear();
  const key = `${author.toLowerCase()}${year}`;

  const bib = `@article{${key},
  title = {${paper.title}},
  author = {${authorString}},
  year = {${year}},
  journal = {${paper.journal || 'BioReader Library'}},
  doi = {${paper.doi || ''}},
  url = {${paper.url || ''}}
}`;

  return {
    filename: `${safeName(paper.title.slice(0, 40))}.bib`,
    content: bib,
    mime: 'text/plain',
  };
}

export function exportNotesToAnki({ paper, notes }) {
  // Simple CSV format for Anki: Front, Back, Tags
  let csv = 'Front,Back,Tags\n';

  for (const note of notes) {
    const front = `\"[${paper.title}] ${note.type.toUpperCase()}: ${note.section || 'General'}\"`;
    const back = `\"${(note.note_text || '').replace(/"/g, '""')}<br><br><i>Excerpt: ${note.highlighted_text || ''}</i>\"`;
    const tags = `\"bioreader ${(note.tags || []).join(' ')}\"`;
    csv += `${front},${back},${tags}\n`;
  }

  return {
    filename: `${safeName(paper.title.slice(0, 40))}_anki.csv`,
    content: csv,
    mime: 'text/csv',
  };
}

export async function exportTopicToDocx({ topic, notes, papersById }) {
  const children = [
    new Paragraph({ text: `Topic: ${topic.name}`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Description: ${topic.description || 'No description.'}` }),
    new Paragraph({ text: `Total notes: ${notes.length}` }),
  ];

  for (const note of notes) {
    const paper = papersById.get(note.paper_id);
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`${paper?.title || 'Unknown paper'} (Page ${note.page ?? 'N/A'})`)],
      })
    );
    if (note.highlighted_text) {
      children.push(new Paragraph({ text: `Quote: ${note.highlighted_text}` }));
    }
    children.push(new Paragraph({ text: note.note_text }));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${safeName(topic.name)}_topic_notes.docx`;
  return { filename, blob, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
}

export function exportTopicToJson({ topic, notes }) {
  return {
    filename: `${safeName(topic.name)}_topic_notes.json`,
    content: JSON.stringify({ topic, notes }, null, 2),
    mime: 'application/json',
  };
}

export function downloadExport(exported) {
  const href = exported.blob ? URL.createObjectURL(exported.blob) : URL.createObjectURL(new Blob([exported.content], { type: exported.mime }));
  const link = document.createElement('a');
  link.href = href;
  link.download = exported.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
