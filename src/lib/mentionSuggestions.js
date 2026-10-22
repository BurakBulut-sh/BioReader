import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList } from '../components/NotesPanel/MentionList.jsx';

export const createSuggestion = (papers, topics, notes) => ({
    items: ({ query }) => {
        const paperItems = papers
            .map(p => ({ id: `paper-${p.id}`, label: p.title, type: 'paper' }))
            .filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

        const topicItems = topics
            .map(t => ({ id: `topic-${t.id}`, label: t.name, type: 'topic' }))
            .filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

        const noteItems = notes
            .map(n => ({ id: `note-${n.id}`, label: n.note_text.slice(0, 40), type: 'note' }))
            .filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

        return [...paperItems, ...topicItems, ...noteItems].slice(0, 10);
    },

    render: () => {
        let component;
        let popup;

        return {
            onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        };
    },
});
