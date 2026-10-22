const workflowWeights = {
  wgs: ['whole genome', 'wgs', 'coverage', 'variant', 'germline', 'somatic'],
  rnaseq: ['rna-seq', 'differential expression', 'transcript', 'deseq2', 'tpm', 'fpkm'],
  chipseq: ['chip-seq', 'peak', 'macs2', 'idr', 'motif'],
  variant_calling: ['snv', 'indel', 'vqsr', 'genotype', 'phasing', 'haplotype'],
  metagenomic: ['metagenomic', 'microbiome', 'taxonomic', '16s', 'kraken'],
};

export function inferWorkflowFromText(text) {
  const normalized = text.toLowerCase();
  const scores = Object.entries(workflowWeights).map(([key, terms]) => {
    const score = terms.reduce((sum, term) => sum + (normalized.includes(term) ? 1 : 0), 0);
    return { key, score };
  });

  const top = scores.sort((a, b) => b.score - a.score)[0];
  if (!top || top.score === 0) {
    return { key: 'other', score: 0 };
  }

  return top;
}

export function workflowLabel(workflow) {
  switch (workflow) {
    case 'wgs':
      return 'WGS Analysis Paper';
    case 'rnaseq':
      return 'RNA-seq Analysis Paper';
    case 'chipseq':
      return 'ChIP-seq Analysis Paper';
    case 'variant_calling':
      return 'Variant Calling Study';
    case 'metagenomic':
      return 'Metagenomic Study';
    default:
      return 'General Life Science Paper';
  }
}
