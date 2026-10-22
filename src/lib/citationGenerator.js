/**
 * Citation Generator: formats paper metadata into standard citation styles.
 */

/**
 * @param {Object} paper - { title, authors, year, doi, journal }
 * @param {string} format - 'apa' | 'mla' | 'chicago' | 'vancouver' | 'bibtex'
 * @returns {string}
 */
export function formatCitation(paper = {}, format = 'apa') {
    const title = paper.title || 'Untitled';
    const authors = paper.authors || 'Unknown Author';
    const year = paper.year || new Date().getFullYear();
    const journal = paper.journal || '';
    const doi = paper.doi || '';

    switch (format) {
        case 'apa':
            return `${authors} (${year}). ${title}.${journal ? ` ${journal}.` : ''}${doi ? ` https://doi.org/${doi}` : ''}`;

        case 'mla':
            return `${authors}. "${title}."${journal ? ` ${journal},` : ''} ${year}.${doi ? ` doi:${doi}.` : ''}`;

        case 'chicago':
            return `${authors}. "${title}."${journal ? ` ${journal}` : ''} (${year}).${doi ? ` https://doi.org/${doi}.` : ''}`;

        case 'vancouver':
            return `${authors}. ${title}.${journal ? ` ${journal}.` : ''} ${year}.${doi ? ` doi: ${doi}` : ''}`;

        case 'bibtex': {
            const key = authors.split(',')[0]?.split(' ').pop()?.toLowerCase() || 'ref';
            return `@article{${key}${year},\n  title = {${title}},\n  author = {${authors}},\n  year = {${year}},${journal ? `\n  journal = {${journal}},` : ''}${doi ? `\n  doi = {${doi}},` : ''}\n}`;
        }

        default:
            return `${authors} (${year}). ${title}.`;
    }
}

export const CITATION_FORMATS = [
    { key: 'apa', label: 'APA' },
    { key: 'mla', label: 'MLA' },
    { key: 'chicago', label: 'Chicago' },
    { key: 'vancouver', label: 'Vancouver' },
    { key: 'bibtex', label: 'BibTeX' },
];
