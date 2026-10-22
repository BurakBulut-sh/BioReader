/**
 * Markdown Export: generates markdown from notes and paper metadata.
 */

export function generateNotesMarkdown(paper, notes) {
    if (!paper) return '';

    let md = `# Notes: ${paper.title}\n\n`;
    if (paper.authors) md += `**Authors:** ${paper.authors}\n`;
    if (paper.year) md += `**Year:** ${paper.year}\n`;
    if (paper.doi) md += `**DOI:** ${paper.doi}\n`;
    md += `\n---\n\n`;

    if (notes.length === 0) {
        md += `*No notes recorded for this paper.*\n`;
        return md;
    }

    // Group notes by section if available, otherwise just list them
    const sections = {};
    notes.forEach(note => {
        const sec = note.section || 'General';
        if (!sections[sec]) sections[sec] = [];
        sections[sec].push(note);
    });

    Object.entries(sections).forEach(([section, sectionNotes]) => {
        md += `## ${section}\n\n`;
        sectionNotes.forEach(note => {
            const typeLabel = note.type ? `[${note.type.toUpperCase()}] ` : '';
            md += `### ${typeLabel}${note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Note'}\n`;
            if (note.page) md += `*Page ${note.page}*\n\n`;

            if (note.highlighted_text) {
                md += `> ${note.highlighted_text}\n\n`;
            }

            md += `${note.note_text}\n\n`;
        });
    });

    return md;
}
