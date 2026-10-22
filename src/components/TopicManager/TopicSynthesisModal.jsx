import { useMemo, useState } from 'react';
import { exportTopicToDocx, exportTopicToJson, downloadExport } from '../../lib/exporters.js';

export function TopicSynthesisModal({
  open,
  topic,
  notes,
  papers,
  onClose,
  onUpdateMeta,
}) {
  const [sortBy, setSortBy] = useState('chronological');
  const [metaNote, setMetaNote] = useState('');

  const sortedNotes = useMemo(() => {
    const list = [...notes];
    if (sortBy === 'chronological') {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    if (sortBy === 'paper') {
      list.sort((a, b) => (papers.get(a.paper_id)?.title || '').localeCompare(papers.get(b.paper_id)?.title || ''));
    }
    if (sortBy === 'type') {
      list.sort((a, b) => a.type.localeCompare(b.type));
    }
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0));
    }
    return list;
  }, [notes, papers, sortBy]);

  const paperCount = new Set(notes.map((note) => note.paper_id)).size;

  if (!open || !topic) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Topic synthesis view">
      <div className="modal topic-synthesis-modal">
        <header className="modal-header">
          <h2>{topic.name} Synthesis</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close topic synthesis">
            ✕
          </button>
        </header>

        <p className="topic-overview">
          <strong>{paperCount} papers</strong> discuss this topic. Compare insights, contradictions, and reusable methods.
        </p>

        <div className="topic-controls">
          <label>
            Sort notes by
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="chronological">Chronological</option>
              <option value="paper">By paper</option>
              <option value="rating">By rating</option>
              <option value="type">By note type</option>
            </select>
          </label>

          <div className="topic-export-row">
            <button
              className="button-primary"
              onClick={async () => {
                const exported = await exportTopicToDocx({ topic, notes: sortedNotes, papersById: papers });
                downloadExport(exported);
              }}
            >
              Export DOCX
            </button>
            <button
              className="button-secondary"
              onClick={() => {
                const exported = exportTopicToJson({ topic, notes: sortedNotes });
                downloadExport(exported);
              }}
            >
              Export JSON
            </button>
          </div>
        </div>

        <section style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Synthesis Meta-Notes</h3>
          <textarea
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '1px solid var(--gray-300)',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              marginBottom: '12px',
              resize: 'vertical'
            }}
            value={metaNote}
            onChange={(event) => setMetaNote(event.target.value)}
            placeholder="Summarize what this topic means across papers, unresolved contradictions, and next experiments."
          />
          <button
            className="button-primary"
            style={{ width: '100%' }}
            onClick={() => onUpdateMeta?.(metaNote)}
          >
            Save Synthesis Note
          </button>
        </section>

        <section className="topic-note-list">
          {sortedNotes.map((note) => (
            <article key={note.id} className={`topic-note type-${note.type}`}>
              <header>
                <strong>{papers.get(note.paper_id)?.title || 'Unknown paper'}</strong>
                <span>
                  {note.type} · page {note.page || 'N/A'}
                </span>
              </header>
              {note.highlighted_text ? <blockquote>{note.highlighted_text}</blockquote> : null}
              <p>{note.note_text}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
