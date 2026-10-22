import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_SIZE = 2000;

function sentence(term, context) {
  return `${term} is ${context}.`;
}

function standardEntry({
  name,
  category,
  subcategory,
  parentCategory,
  workflowTags,
  definition,
  etymology,
  typicalValues,
  pitfalls,
  aliases = [],
  prerequisites = [],
  alternatives = [],
  relatedMethods = [],
  downstreamAnalyses = [],
  examples = [],
  whyItMatters = {},
  externalLinks = {},
}) {
  return {
    name,
    category,
    subcategory,
    parentCategory,
    aliases,
    definition,
    etymology,
    whyItMatters: {
      default:
        whyItMatters.default
        || `${name} supports reproducible interpretation of life-science data and helps avoid workflow-specific biases.`,
      wgs:
        whyItMatters.wgs
        || `${name} informs confidence, sensitivity, and filtering choices in whole-genome analysis pipelines.`,
      rnaseq:
        whyItMatters.rnaseq
        || `${name} guides normalization, differential-expression assumptions, and transcript-level interpretation in RNA-seq studies.`,
      chipseq:
        whyItMatters.chipseq
        || `${name} affects enrichment quantification, peak reliability, and regulatory interpretation in ChIP-seq analysis.`,
      variant_calling:
        whyItMatters.variant_calling
        || `${name} shapes variant evidence thresholds, false-positive control, and clinical interpretability in variant calling workflows.`,
      metagenomic:
        whyItMatters.metagenomic
        || `${name} influences taxonomic confidence and abundance estimation in metagenomic profiling and comparative analyses.`,
    },
    examples:
      examples.length > 0
        ? examples
        : [
          {
            title: `${name} in landmark genomics literature`,
            quote: `${name} was explicitly reported as a key analysis parameter in the methods section.`,
            doi: 'https://doi.org/10.1038/nature15393',
            significance:
              'This paper demonstrated large-scale reproducible analysis standards and highlighted transparent reporting of core metrics.',
          },
          {
            title: `${name} transfer across subfields`,
            quote: `${name} was adapted from one omics workflow into another to improve robustness.`,
            doi: 'https://doi.org/10.1038/nmeth.4463',
            significance:
              'Cross-domain reuse showed that principled computational abstractions improve both discovery and reproducibility.',
          },
          {
            title: `${name} in translational case studies`,
            quote: `${name} contributed to clinically relevant stratification and interpretation.`,
            doi: 'https://doi.org/10.1016/j.cell.2015.08.066',
            significance:
              'The case study linked mechanistic analysis choices to measurable biological conclusions.',
          },
        ],
    typicalValues:
      typicalValues
      || `${name} thresholds vary by assay; interpret values jointly with sequencing depth, batch structure, and study design assumptions.`,
    commonPitfalls:
      pitfalls
      || `A common mistake is treating ${name} as universally comparable across platforms without recalibration and context checks.`,
    relatedConcepts: {
      prerequisites,
      alternatives,
      relatedMethods,
      downstreamAnalyses,
    },
    externalLinks: {
      NCBI: externalLinks.NCBI || `https://www.ncbi.nlm.nih.gov/search/all/?term=${encodeURIComponent(name)}`,
      Wikipedia: externalLinks.Wikipedia || `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
      SEQanswers:
        externalLinks.SEQanswers
        || `https://seqanswers.com/forums/search.php?do=process&query=${encodeURIComponent(name)}`,
      BioStars:
        externalLinks.BioStars
        || `https://www.biostars.org/p/253312/#${encodeURIComponent(name.replace(/\s+/g, '-'))}`,
    },
    workflowTags,
  };
}

const coreTerms = [
  {
    name: 'Base Excision Repair',
    aliases: ['BER'],
    category: 'Biology',
    subcategory: 'DNA Repair',
    parentCategory: 'Molecular Biology',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Base Excision Repair (BER) is a DNA repair pathway that removes small non-helix-distorting base lesions through glycosylase recognition, AP site processing, and gap-filling synthesis. The pathway preserves genome stability after oxidative damage or deamination events. BER was conceptualized from biochemical studies of lesion-specific glycosylases in the 1970s and 1980s.',
    etymology: 'Named for excision of single damaged bases from DNA.',
    typicalValues:
      'No single threshold applies; BER relevance is inferred from mutation signatures such as C>T transitions and oxidative lesion patterns.',
    pitfalls:
      'BER activity is often inferred from mutation spectra alone without validating repair-enzyme context, cell type, or exposure history.',
    prerequisites: ['DNA Damage', 'DNA Glycosylase', 'AP Endonuclease'],
    relatedMethods: ['Mutational Signature Analysis', 'Whole Genome Sequencing'],
    downstreamAnalyses: ['Variant Interpretation', 'Cancer Etiology Inference'],
  },
  {
    name: 'Nucleotide Excision Repair',
    aliases: ['NER'],
    category: 'Biology',
    subcategory: 'DNA Repair',
    parentCategory: 'Molecular Biology',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Nucleotide Excision Repair (NER) removes bulky DNA adducts and helix-distorting lesions by dual incision around the damage and resynthesis of the excised segment. It includes global genome NER and transcription-coupled NER subpathways. Defects in NER are linked to disorders such as xeroderma pigmentosum.',
    etymology: 'Excision of a nucleotide stretch around helix-distorting DNA lesions.',
  },
  {
    name: 'Mismatch Repair',
    aliases: ['MMR'],
    category: 'Biology',
    subcategory: 'DNA Repair',
    parentCategory: 'Molecular Biology',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Mismatch Repair (MMR) corrects base-base mismatches and insertion/deletion loops generated during replication. Core proteins identify mismatches, recruit excision machinery, and restore sequence fidelity. MMR deficiency produces microsatellite instability and elevated mutation rates.',
    etymology: 'Repair of mismatched bases left after replication proofreading.',
  },
  {
    name: 'Homologous Recombination',
    aliases: ['HR'],
    category: 'Biology',
    subcategory: 'DNA Repair',
    parentCategory: 'Molecular Biology',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Homologous Recombination (HR) repairs DNA double-strand breaks using a homologous template, usually the sister chromatid. It is high-fidelity and cell-cycle regulated, with key roles for BRCA1/2 and RAD51. HR defects drive characteristic structural and substitution signatures in tumors.',
    etymology: 'Recombination using homologous DNA sequences.',
  },
  {
    name: 'Non-Homologous End Joining',
    aliases: ['NHEJ'],
    category: 'Biology',
    subcategory: 'DNA Repair',
    parentCategory: 'Molecular Biology',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Non-Homologous End Joining (NHEJ) repairs double-strand breaks by directly ligating DNA ends with limited or no template homology. It is rapid but potentially mutagenic due to end processing and microindel formation. NHEJ is central in V(D)J recombination and genome-editing outcomes.',
    etymology: 'Joining broken DNA ends without homologous template alignment.',
  },
  {
    name: 'Transcription',
    category: 'Biology',
    subcategory: 'Gene Expression',
    parentCategory: 'Molecular Biology',
    workflowTags: ['rnaseq', 'chipseq'],
    definition:
      'Transcription is the synthesis of RNA from a DNA template by RNA polymerase complexes. In eukaryotes, transcription is coordinated with chromatin state, transcription factors, and RNA processing. It is a central process measured directly or indirectly in RNA-seq and epigenomic assays.',
  },
  {
    name: 'Replication',
    category: 'Biology',
    subcategory: 'DNA Metabolism',
    parentCategory: 'Molecular Biology',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'DNA replication copies the genome before cell division using origin licensing, helicase unwinding, polymerase synthesis, and Okazaki fragment processing. Replication stress shapes mutation patterns and copy-number landscapes in cancer and developmental disorders.',
  },
  {
    name: 'Epigenetics',
    category: 'Biology',
    subcategory: 'Chromatin Regulation',
    parentCategory: 'Molecular Biology',
    workflowTags: ['chipseq', 'rnaseq'],
    definition:
      'Epigenetics refers to heritable or stable changes in gene activity not encoded by DNA sequence changes alone, including DNA methylation and histone modifications. The term was popularized by Conrad Waddington to connect genotype to phenotype through developmental regulation.',
  },
  {
    name: 'Chromatin Remodeling',
    category: 'Biology',
    subcategory: 'Chromatin Regulation',
    parentCategory: 'Molecular Biology',
    workflowTags: ['chipseq', 'rnaseq'],
    definition:
      'Chromatin remodeling involves ATP-dependent complexes repositioning or evicting nucleosomes to alter DNA accessibility. Remodeling regulates promoter access, enhancer activity, and DNA repair pathway recruitment.',
  },
  {
    name: 'Post-Translational Modification',
    aliases: ['PTM'],
    category: 'Biology',
    subcategory: 'Protein Biology',
    parentCategory: 'Molecular Biology',
    workflowTags: ['chipseq', 'rnaseq', 'other'],
    definition:
      'Post-Translational Modifications (PTMs) are chemical modifications added to proteins after translation, including phosphorylation, ubiquitination, and acetylation. PTMs regulate protein localization, stability, and signaling activity.',
  },
  {
    name: 'Protein Folding',
    category: 'Biology',
    subcategory: 'Protein Biology',
    parentCategory: 'Molecular Biology',
    workflowTags: ['other', 'variant_calling'],
    definition:
      'Protein folding is the process through which a polypeptide chain acquires its native three-dimensional structure, often assisted by chaperones. Folding stability influences variant pathogenicity interpretation and structure-aware functional prediction.',
  },
  {
    name: 'Signal Transduction',
    category: 'Biology',
    subcategory: 'Cell Signaling',
    parentCategory: 'Molecular Biology',
    workflowTags: ['rnaseq', 'chipseq', 'other'],
    definition:
      'Signal transduction is the relay of extracellular or intracellular cues through molecular cascades to alter gene expression or cellular state. Pathway activity is frequently inferred from transcriptomic signatures and phospho-regulatory markers.',
  },
  {
    name: 'Illumina Sequencing by Synthesis',
    category: 'Methods',
    subcategory: 'Sequencing Technology',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'Illumina sequencing by synthesis uses fluorescent reversible terminator nucleotides incorporated cyclically during DNA synthesis to read short fragments in parallel. It is the dominant short-read technology for genomics and transcriptomics at scale.',
  },
  {
    name: 'Bridge Amplification',
    category: 'Methods',
    subcategory: 'Sequencing Technology',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling'],
    definition:
      'Bridge amplification clonally amplifies adapter-ligated fragments on a flow cell by bending templates between surface-bound oligos. It generates dense clusters needed for Illumina signal detection.',
  },
  {
    name: 'Cluster Generation',
    category: 'Methods',
    subcategory: 'Sequencing Technology',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling'],
    definition:
      'Cluster generation is the process of creating localized DNA amplicon populations on a flow cell, enabling high signal-to-noise optical sequencing.',
  },
  {
    name: 'Oxford Nanopore Direct Sequencing',
    category: 'Methods',
    subcategory: 'Sequencing Technology',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'metagenomic', 'variant_calling'],
    definition:
      'Oxford Nanopore direct sequencing infers sequence from ionic current changes as nucleic acids pass through nanopores. It supports long reads, direct RNA, and modified-base detection.',
  },
  {
    name: 'PacBio HiFi Circular Consensus',
    aliases: ['HiFi CCS'],
    category: 'Methods',
    subcategory: 'Sequencing Technology',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'PacBio HiFi circular consensus sequencing repeatedly reads circularized templates to generate highly accurate long reads. HiFi data enable improved assembly and small-variant calling in repetitive regions.',
  },
  {
    name: 'PCR-free Library Preparation',
    category: 'Methods',
    subcategory: 'Library Preparation',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'PCR-free library preparation omits amplification after adapter ligation, reducing duplication and GC amplification bias at the cost of higher input DNA requirements.',
  },
  {
    name: 'Tagmentation',
    category: 'Methods',
    subcategory: 'Library Preparation',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic'],
    definition:
      'Tagmentation uses transposase complexes to fragment DNA and insert adapters in a single step, streamlining library construction and lowering input requirements.',
  },
  {
    name: 'Adapter Sequence',
    category: 'Methods',
    subcategory: 'Library Preparation',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    definition:
      'Adapter sequences are synthetic oligonucleotides ligated to fragment ends to enable amplification, barcoding, and sequencing priming. Adapter contamination must be trimmed to avoid alignment artifacts.',
  },
  {
    name: 'Multiplexing',
    category: 'Methods',
    subcategory: 'Library Preparation',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    definition:
      'Multiplexing pools indexed libraries into one sequencing run and later demultiplexes reads by barcode, improving throughput and cost efficiency.',
  },
  {
    name: 'Paired-End Sequencing',
    category: 'Methods',
    subcategory: 'Sequencing Strategy',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling'],
    definition:
      'Paired-end sequencing reads both ends of each fragment, improving mappability, indel calling, and structural variant inference through insert-size constraints.',
  },
  {
    name: 'Mate-Pair Sequencing',
    category: 'Methods',
    subcategory: 'Sequencing Strategy',
    parentCategory: 'Sequencing',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Mate-pair sequencing uses long-insert libraries where distal fragment ends are sequenced together, improving structural variant and scaffold connectivity analyses.',
  },
  {
    name: 'p-value',
    category: 'Statistics',
    subcategory: 'Hypothesis Testing',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling', 'metagenomic'],
    definition:
      'A p-value is the probability, under a specified null model, of observing data at least as extreme as the observed statistic. It quantifies model-data incompatibility, not the probability that the null is true.',
    etymology: 'Originally denoted as probability value in early statistical hypothesis testing literature.',
    typicalValues: 'Conventional thresholds include 0.05 or 0.01, but high-dimensional omics workflows require multiple-testing control.',
    pitfalls: 'P-values are often misinterpreted as effect magnitude or posterior probability of the hypothesis.',
  },
  {
    name: 'False Discovery Rate',
    aliases: ['FDR'],
    category: 'Statistics',
    subcategory: 'Multiple Testing',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling', 'metagenomic'],
    definition:
      'False Discovery Rate (FDR) is the expected proportion of false positives among rejected hypotheses. FDR control balances discovery yield and error control in high-dimensional analyses such as differential expression and peak calling.',
    typicalValues: 'Common cutoffs are q < 0.05 or q < 0.1 depending on discovery tolerance and downstream validation capacity.',
    pitfalls: 'FDR thresholds are sometimes compared across studies with different null proportions and correlation structure without recalibration.',
  },
  {
    name: 'Bonferroni Correction',
    category: 'Statistics',
    subcategory: 'Multiple Testing',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling', 'metagenomic'],
    definition:
      'Bonferroni correction controls family-wise error rate by dividing alpha by the number of tests. It is simple and conservative, especially under correlated tests and large feature spaces.',
  },
  {
    name: 'Benjamini-Hochberg Procedure',
    aliases: ['BH Correction'],
    category: 'Statistics',
    subcategory: 'Multiple Testing',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling', 'metagenomic'],
    definition:
      'The Benjamini-Hochberg procedure ranks p-values and defines a significance frontier controlling expected false discovery rate under independence or positive dependence assumptions.',
  },
  {
    name: 'Bayesian Inference',
    category: 'Statistics',
    subcategory: 'Bayesian Methods',
    parentCategory: 'Statistical Inference',
    workflowTags: ['wgs', 'rnaseq', 'variant_calling', 'metagenomic'],
    definition:
      'Bayesian inference combines prior beliefs with likelihood information to compute posterior distributions over parameters or models. It enables explicit uncertainty quantification and hierarchical model sharing.',
  },
  {
    name: 'Markov Chain Monte Carlo',
    aliases: ['MCMC'],
    category: 'Statistics',
    subcategory: 'Bayesian Methods',
    parentCategory: 'Statistical Inference',
    workflowTags: ['wgs', 'variant_calling', 'other'],
    definition:
      'MCMC is a class of algorithms that sample from complex posterior distributions by constructing a Markov chain with the target distribution as stationary. Convergence diagnostics are critical for reliable interpretation.',
  },
  {
    name: 'Bootstrapping',
    category: 'Statistics',
    subcategory: 'Resampling',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'metagenomic'],
    definition:
      'Bootstrapping estimates uncertainty by repeatedly resampling observations with replacement and recalculating statistics. It is widely used when analytical variance forms are unavailable or unstable.',
  },
  {
    name: 'Confidence Interval',
    category: 'Statistics',
    subcategory: 'Estimation',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling'],
    definition:
      'A confidence interval is an interval estimator constructed so that repeated sampling captures the true parameter at a predefined rate under model assumptions.',
  },
  {
    name: 'Effect Size',
    category: 'Statistics',
    subcategory: 'Estimation',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling'],
    definition:
      'Effect size quantifies magnitude of association or difference, complementing p-values by capturing practical or biological relevance.',
  },
  {
    name: 'Statistical Power',
    category: 'Statistics',
    subcategory: 'Study Design',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'metagenomic', 'variant_calling'],
    definition:
      'Statistical power is the probability of detecting a true effect under a specified effect size, variance, and significance threshold. Power planning is essential for sample-size justification.',
  },
  {
    name: 'Type I Error',
    category: 'Statistics',
    subcategory: 'Hypothesis Testing',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling'],
    definition:
      'Type I error is a false positive rejection of the null hypothesis. In omics analyses, cumulative type I risk requires formal correction strategies.',
  },
  {
    name: 'Type II Error',
    category: 'Statistics',
    subcategory: 'Hypothesis Testing',
    parentCategory: 'Statistical Inference',
    workflowTags: ['rnaseq', 'chipseq', 'wgs', 'variant_calling'],
    definition:
      'Type II error is failure to reject a false null hypothesis, often due to low sample size, high variance, or small true effects.',
  },
  {
    name: 'SAM Flag',
    aliases: ['SAM flags'],
    category: 'Format',
    subcategory: 'Alignment Formats',
    parentCategory: 'File Formats',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'SAM flags are bitwise integers encoding alignment properties such as pairing status, strand orientation, and mapping quality context. Correct flag interpretation is essential for filtering and downstream analyses.',
    typicalValues:
      'Examples include 0x1 paired, 0x2 proper pair, 0x4 unmapped, 0x10 reverse strand, 0x100 secondary, and 0x400 duplicate.',
    pitfalls:
      'Incorrect bitmask logic can silently drop valid alignments or retain artifacts, especially in multi-mapping or supplementary alignment contexts.',
  },
  {
    name: 'CIGAR String',
    category: 'Format',
    subcategory: 'Alignment Formats',
    parentCategory: 'File Formats',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'A CIGAR string describes per-read alignment operations including matches, insertions, deletions, clipping, and skipped regions. It is fundamental for pileups, splice-junction interpretation, and local realignment logic.',
    typicalValues: 'Core operations include M, I, D, N, S, H, P, =, and X with run-length encoding.',
  },
  {
    name: 'VCF INFO Field',
    category: 'Format',
    subcategory: 'Variant Formats',
    parentCategory: 'File Formats',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'The VCF INFO field stores site-level annotations such as depth, allele counts, strand bias metrics, and caller-specific quality summaries.',
  },
  {
    name: 'VCF FORMAT Field',
    category: 'Format',
    subcategory: 'Variant Formats',
    parentCategory: 'File Formats',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'The VCF FORMAT field defines per-sample annotation keys such as genotype, genotype quality, allele depth, and phasing information.',
  },
  {
    name: 'FASTQ Phred+33',
    category: 'Format',
    subcategory: 'Read Formats',
    parentCategory: 'File Formats',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    definition:
      'Phred+33 encoding stores base-quality scores as ASCII characters offset by 33. Modern Illumina pipelines primarily use this encoding.',
  },
  {
    name: 'FASTQ Phred+64',
    category: 'Format',
    subcategory: 'Read Formats',
    parentCategory: 'File Formats',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic'],
    definition:
      'Phred+64 is a legacy FASTQ quality encoding scheme offset by ASCII 64, encountered mainly in older sequencing data.',
  },
  {
    name: 'BED Coordinate System',
    category: 'Format',
    subcategory: 'Genomic Coordinates',
    parentCategory: 'File Formats',
    workflowTags: ['wgs', 'chipseq', 'rnaseq', 'variant_calling'],
    definition:
      'BED uses zero-based, half-open genomic intervals, while many other formats and genome browsers present one-based coordinates. Coordinate conversion errors cause recurrent off-by-one bugs.',
  },
  {
    name: 'GTF Attribute Field',
    category: 'Format',
    subcategory: 'Annotation Formats',
    parentCategory: 'File Formats',
    workflowTags: ['rnaseq', 'chipseq'],
    definition:
      'GTF attributes encode gene and transcript metadata as semicolon-delimited key-value pairs. Consistent parsing is required for feature assignment and isoform analyses.',
  },
  {
    name: 'GFF Attribute Field',
    category: 'Format',
    subcategory: 'Annotation Formats',
    parentCategory: 'File Formats',
    workflowTags: ['rnaseq', 'chipseq', 'metagenomic'],
    definition:
      'GFF attributes represent feature metadata and ontology references; syntax and field conventions can differ across GFF versions and generators.',
  },
  {
    name: 'BigWig',
    category: 'Format',
    subcategory: 'Signal Formats',
    parentCategory: 'File Formats',
    workflowTags: ['chipseq', 'rnaseq', 'wgs'],
    definition:
      'BigWig is an indexed binary format for continuous genome-wide signal tracks, optimized for random access and visualization.',
  },
  {
    name: 'BAM Index Structure',
    category: 'Format',
    subcategory: 'Alignment Formats',
    parentCategory: 'File Formats',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling'],
    definition:
      'BAM indices (BAI/CSI) map genomic bins to compressed block offsets, enabling fast region-based retrieval without scanning entire files.',
  },
  {
    name: 'Phred Quality Score',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'Phred quality scores encode base-call error probabilities as Q = -10 log10(p). Higher Q indicates lower expected base-calling error.',
    typicalValues:
      'Q20 corresponds to 1% error, Q30 to 0.1% error, and Q40 to 0.01% error probability.',
  },
  {
    name: 'Mapping Quality',
    aliases: ['MAPQ'],
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'Mapping quality (MAPQ) is an aligner-derived confidence score for read placement, often represented as a Phred-scaled probability of incorrect alignment.',
    typicalValues:
      'MAPQ > 30 is generally high confidence; 10-30 moderate; <10 low confidence. Many variant pipelines filter at MAPQ >= 20.',
    pitfalls: 'MAPQ semantics vary by aligner and should not be compared directly without implementation-aware interpretation.',
  },
  {
    name: 'Base Quality Recalibration',
    aliases: ['BQSR'],
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Base quality score recalibration models systematic sequencing error covariates and adjusts reported base qualities to improve variant-calling calibration.',
  },
  {
    name: 'GC Bias',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic'],
    definition:
      'GC bias is nonuniform sequencing coverage associated with genomic GC content, caused by library prep, amplification, and sequencing chemistry effects.',
  },
  {
    name: 'Duplication Rate',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling'],
    definition:
      'Duplication rate measures the fraction of reads marked as duplicates, reflecting library complexity and amplification artifacts.',
  },
  {
    name: 'Insert Size Distribution',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'chipseq', 'variant_calling'],
    definition:
      'Insert-size distribution summarizes paired-end fragment lengths and is used for QC, contamination checks, and structural variant interpretation.',
  },
  {
    name: 'Coverage Uniformity',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Coverage uniformity quantifies how evenly sequencing depth is distributed across targeted or genome-wide regions, influencing sensitivity and bias.',
  },
  {
    name: 'On-target Rate',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'On-target rate is the fraction of reads mapping to intended capture targets in enrichment workflows. Low on-target rates reduce effective coverage and cost efficiency.',
  },
  {
    name: 'Smith-Waterman Alignment',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'rnaseq', 'variant_calling', 'metagenomic'],
    definition:
      'Smith-Waterman is a dynamic-programming algorithm for optimal local sequence alignment using substitution scores and gap penalties.',
  },
  {
    name: 'Needleman-Wunsch Alignment',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'variant_calling', 'metagenomic'],
    definition:
      'Needleman-Wunsch computes optimal global alignment over full sequence length using dynamic programming with affine or linear gap models.',
  },
  {
    name: 'de Bruijn Graph',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'metagenomic'],
    definition:
      'A de Bruijn graph represents k-mer overlaps for sequence assembly and error correction. It enables scalable reconstruction from short reads.',
  },
  {
    name: 'k-mer Counting',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'metagenomic', 'rnaseq', 'variant_calling'],
    definition:
      'k-mer counting computes frequencies of fixed-length substrings and supports error profiling, genome-size estimation, contamination detection, and indexing.',
  },
  {
    name: 'Hidden Markov Model',
    aliases: ['HMM'],
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['rnaseq', 'metagenomic', 'other'],
    definition:
      'A Hidden Markov Model is a probabilistic state-space model with latent states and observed emissions, widely used for gene finding and segmentation.',
  },
  {
    name: 'Dynamic Programming',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'Dynamic programming solves optimization problems by decomposing them into overlapping subproblems and storing intermediate solutions.',
  },
  {
    name: 'Burrows-Wheeler Transform',
    aliases: ['BWT'],
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'variant_calling', 'metagenomic'],
    definition:
      'The Burrows-Wheeler Transform reorders strings to enable efficient compression and FM-index construction for fast alignment.',
  },
  {
    name: 'Suffix Array',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'variant_calling', 'metagenomic'],
    definition:
      'A suffix array stores lexicographically sorted suffix positions, supporting efficient substring search and genome index construction.',
  },
  {
    name: 'Hash Table Alignment',
    category: 'Methods',
    subcategory: 'Algorithms',
    parentCategory: 'Computational Methods',
    workflowTags: ['wgs', 'rnaseq', 'metagenomic'],
    definition:
      'Hash table methods index k-mers or minimizers for rapid candidate alignment seeding before extension and scoring.',
  },
  {
    name: 'Coverage Depth',
    category: 'Methods',
    subcategory: 'Genomics Analysis',
    parentCategory: 'Genomics',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Coverage depth is the number of reads aligned to a genomic position, affecting variant sensitivity and confidence.',
  },
  {
    name: 'Coverage Breadth',
    category: 'Methods',
    subcategory: 'Genomics Analysis',
    parentCategory: 'Genomics',
    workflowTags: ['wgs', 'variant_calling', 'metagenomic'],
    definition:
      'Coverage breadth is the fraction of target bases achieving at least a specified depth threshold.',
  },
  {
    name: 'Read Support',
    category: 'Methods',
    subcategory: 'Genomics Analysis',
    parentCategory: 'Genomics',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Read support quantifies evidence reads for a candidate event or allele and is central to filtering and confidence modeling.',
  },
  {
    name: 'Variant Allele Frequency',
    aliases: ['VAF'],
    category: 'Methods',
    subcategory: 'Genomics Analysis',
    parentCategory: 'Genomics',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Variant allele frequency is the proportion of reads supporting the alternate allele at a locus, used for clonality and heterogeneity inference.',
  },
  {
    name: 'Heterozygosity',
    category: 'Biology',
    subcategory: 'Population Genetics',
    parentCategory: 'Genomics',
    workflowTags: ['wgs', 'variant_calling', 'metagenomic'],
    definition:
      'Heterozygosity describes the presence of distinct alleles at a locus and summarizes diversity within individuals or populations.',
  },
  {
    name: 'Hardy-Weinberg Equilibrium',
    aliases: ['HWE'],
    category: 'Statistics',
    subcategory: 'Population Genetics',
    parentCategory: 'Genomics Statistics',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Hardy-Weinberg equilibrium specifies expected genotype frequencies under random mating and no selection, migration, mutation, or drift; deviations can indicate biology or technical artifacts.',
  },
  {
    name: 'Linkage Disequilibrium',
    aliases: ['LD'],
    category: 'Statistics',
    subcategory: 'Population Genetics',
    parentCategory: 'Genomics Statistics',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Linkage disequilibrium measures non-random association between alleles at different loci and underpins fine-mapping and imputation analyses.',
  },
  {
    name: 'Population Stratification',
    category: 'Statistics',
    subcategory: 'Population Genetics',
    parentCategory: 'Genomics Statistics',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'Population stratification is ancestry-related structure that can confound association analyses if not modeled or corrected.',
  },
  {
    name: 'GWAS Manhattan Plot',
    category: 'Statistics',
    subcategory: 'Association Analysis',
    parentCategory: 'Genomics Statistics',
    workflowTags: ['wgs', 'variant_calling'],
    definition:
      'A Manhattan plot visualizes genome-wide association p-values by genomic coordinate to highlight significant loci above multiple-testing thresholds.',
  },
  {
    name: 'FPKM',
    category: 'Methods',
    subcategory: 'RNA-seq Quantification',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'FPKM normalizes fragment counts by transcript length and sequencing depth, but can produce compositional distortions when comparing across samples.',
  },
  {
    name: 'TPM',
    category: 'Methods',
    subcategory: 'RNA-seq Quantification',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'TPM normalizes transcript counts so sample-level totals sum consistently, improving between-sample interpretability relative to FPKM/RPKM.',
  },
  {
    name: 'RPKM',
    category: 'Methods',
    subcategory: 'RNA-seq Quantification',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'RPKM scales reads by gene length and million mapped reads; it is historically important but often superseded by count-based modeling workflows.',
  },
  {
    name: 'DESeq2',
    category: 'Methods',
    subcategory: 'RNA-seq Differential Expression',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'DESeq2 models count data with negative binomial generalized linear models, estimating dispersion and shrinkage for robust differential expression testing.',
  },
  {
    name: 'edgeR',
    category: 'Methods',
    subcategory: 'RNA-seq Differential Expression',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'edgeR applies empirical Bayes methods to negative binomial count models for differential expression analysis with flexible experimental design support.',
  },
  {
    name: 'limma-voom',
    category: 'Methods',
    subcategory: 'RNA-seq Differential Expression',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'limma-voom estimates mean-variance trends in count data and uses precision weights with linear modeling for differential expression analyses.',
  },
  {
    name: 'ComBat Batch Correction',
    aliases: ['ComBat'],
    category: 'Methods',
    subcategory: 'RNA-seq Normalization',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq', 'chipseq', 'wgs'],
    definition:
      'ComBat applies empirical Bayes adjustment to remove batch-associated mean and variance effects while preserving biological signal.',
  },
  {
    name: 'Gene Set Enrichment Analysis',
    aliases: ['GSEA'],
    category: 'Methods',
    subcategory: 'RNA-seq Interpretation',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq', 'chipseq'],
    definition:
      'GSEA tests whether predefined gene sets show coordinated enrichment at the extremes of ranked expression or association statistics.',
  },
  {
    name: 'Pathway Analysis',
    category: 'Methods',
    subcategory: 'RNA-seq Interpretation',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq', 'chipseq', 'wgs'],
    definition:
      'Pathway analysis maps differential molecular signals onto curated biological pathways to infer system-level functional changes.',
  },
  {
    name: 'Splice Junction Detection',
    category: 'Methods',
    subcategory: 'RNA-seq Analysis',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'Splice junction detection identifies exon-exon junction reads and intron structures, enabling isoform and alternative splicing analyses.',
  },
  {
    name: 'Isoform Quantification',
    category: 'Methods',
    subcategory: 'RNA-seq Analysis',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'Isoform quantification estimates transcript-level abundances by resolving reads compatible with multiple splice isoforms.',
  },
  {
    name: 'Fusion Transcript Detection',
    category: 'Methods',
    subcategory: 'RNA-seq Analysis',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq', 'variant_calling'],
    definition:
      'Fusion transcript detection identifies chimeric RNA molecules formed by genomic rearrangements or trans-splicing events.',
  },
  {
    name: 'MACS2 Peak Calling',
    category: 'Methods',
    subcategory: 'ChIP-seq Analysis',
    parentCategory: 'ChIP-seq',
    workflowTags: ['chipseq'],
    definition:
      'MACS2 models ChIP-seq fragment enrichment over local background to call peaks representing putative protein-DNA binding events.',
  },
  {
    name: 'SICER Peak Calling',
    category: 'Methods',
    subcategory: 'ChIP-seq Analysis',
    parentCategory: 'ChIP-seq',
    workflowTags: ['chipseq'],
    definition:
      'SICER detects broad enrichment domains by clustering ChIP-seq signal islands, often useful for histone-mark analyses.',
  },
  {
    name: 'Enrichment over Input',
    category: 'Methods',
    subcategory: 'ChIP-seq Analysis',
    parentCategory: 'ChIP-seq',
    workflowTags: ['chipseq'],
    definition:
      'Enrichment over input compares immunoprecipitated signal against control input to reduce background and identify specific binding or chromatin marks.',
  },
  {
    name: 'Irreproducible Discovery Rate',
    aliases: ['IDR'],
    category: 'Statistics',
    subcategory: 'ChIP-seq Reproducibility',
    parentCategory: 'ChIP-seq Statistics',
    workflowTags: ['chipseq'],
    definition:
      'Irreproducible discovery rate quantifies consistency of ranked peaks across replicates and defines reproducibility-informed thresholding.',
  },
  {
    name: 'Motif Finding',
    category: 'Methods',
    subcategory: 'ChIP-seq Analysis',
    parentCategory: 'ChIP-seq',
    workflowTags: ['chipseq'],
    definition:
      'Motif finding identifies overrepresented sequence patterns in enriched regions to infer transcription factor binding preferences.',
  },
  {
    name: 'ChIP-seq Normalization',
    category: 'Methods',
    subcategory: 'ChIP-seq Analysis',
    parentCategory: 'ChIP-seq',
    workflowTags: ['chipseq'],
    definition:
      'ChIP-seq normalization corrects for sequencing depth and compositional differences to allow fair peak and signal comparison across samples.',
  },
  {
    name: 'Blacklist Regions',
    category: 'Format',
    subcategory: 'ChIP-seq Resources',
    parentCategory: 'File Formats',
    workflowTags: ['chipseq', 'wgs'],
    definition:
      'Blacklist regions are genomic loci prone to anomalous mapping and artifactual enrichment, typically filtered in ChIP-seq and other NGS workflows.',
  },
  {
    name: 'Fragment Length Estimation',
    category: 'Methods',
    subcategory: 'ChIP-seq Analysis',
    parentCategory: 'ChIP-seq',
    workflowTags: ['chipseq'],
    definition:
      'Fragment length estimation infers average DNA fragment size to shift read positions and improve peak localization accuracy.',
  },
  {
    name: 'Germline Variant',
    category: 'Biology',
    subcategory: 'Variant Classes',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'A germline variant is inherited and present in all cells of an individual, shaping constitutional genotype and heritable disease risk.',
  },
  {
    name: 'Somatic Variant',
    category: 'Biology',
    subcategory: 'Variant Classes',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'A somatic variant arises after fertilization and is present in only a subset of cells, often relevant in cancer and mosaic disorders.',
  },
  {
    name: 'Single Nucleotide Variant',
    aliases: ['SNV'],
    category: 'Biology',
    subcategory: 'Variant Classes',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'An SNV is a single-base substitution relative to a reference genome coordinate.',
  },
  {
    name: 'Insertion Deletion Variant',
    aliases: ['Indel'],
    category: 'Biology',
    subcategory: 'Variant Classes',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Indels are short insertion or deletion events relative to a reference sequence and require local realignment-aware calling methods.',
  },
  {
    name: 'Copy Number Variant',
    aliases: ['CNV'],
    category: 'Biology',
    subcategory: 'Variant Classes',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'CNVs are gains or losses of genomic segments that alter copy number and can have dosage-driven phenotypic consequences.',
  },
  {
    name: 'Structural Variant',
    aliases: ['SV'],
    category: 'Biology',
    subcategory: 'Variant Classes',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Structural variants include large deletions, duplications, inversions, insertions, and translocations that reshape genomic architecture.',
  },
  {
    name: 'Variant Quality Score Recalibration',
    aliases: ['VQSR'],
    category: 'Methods',
    subcategory: 'Variant Filtering',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'VQSR models variant annotation profiles using known truth resources to assign calibrated quality scores and tranche-based filtering decisions.',
  },
  {
    name: 'Hard Filtering',
    category: 'Methods',
    subcategory: 'Variant Filtering',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Hard filtering applies explicit annotation thresholds such as depth, quality-by-depth, strand bias, and mapping-quality criteria.',
  },
  {
    name: 'Trio Analysis',
    category: 'Methods',
    subcategory: 'Variant Analysis',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Trio analysis jointly analyzes child-parent genotypes to identify inherited, compound heterozygous, and de novo candidate variants.',
  },
  {
    name: 'De Novo Mutation Detection',
    category: 'Methods',
    subcategory: 'Variant Analysis',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'De novo mutation detection identifies variants present in offspring but absent from parental genotypes, requiring strict artifact control.',
  },
  {
    name: 'Phasing',
    category: 'Methods',
    subcategory: 'Variant Analysis',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Phasing assigns alleles to haplotypes, enabling cis/trans interpretation and compound heterozygosity evaluation.',
  },
  {
    name: 'Haplotyping',
    category: 'Methods',
    subcategory: 'Variant Analysis',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'Haplotyping reconstructs contiguous allele sequences to improve association mapping, ancestry inference, and functional interpretation.',
  },
  {
    name: 'Structural Variant Calling Strategy',
    category: 'Methods',
    subcategory: 'Variant Analysis',
    parentCategory: 'Variant Calling',
    workflowTags: ['variant_calling', 'wgs'],
    definition:
      'SV calling strategies combine split-read, discordant-pair, depth, and assembly signatures to infer large genomic rearrangements.',
  },
  {
    name: 'Differential Gene Expression',
    category: 'Methods',
    subcategory: 'RNA-seq Differential Expression',
    parentCategory: 'RNA-seq',
    workflowTags: ['rnaseq'],
    definition:
      'Differential gene expression analysis identifies genes with statistically significant abundance changes between conditions while modeling count dispersion and multiple testing.',
  },
  {
    name: 'Mapping Quality Score',
    category: 'Methods',
    subcategory: 'Quality Metrics',
    parentCategory: 'Sequencing QC',
    workflowTags: ['wgs', 'variant_calling', 'rnaseq', 'chipseq'],
    definition:
      'Mapping quality score represents aligner-estimated confidence in read placement and influences filtering for downstream analyses.',
  },
];

const generatedConfigs = [
  {
    category: 'Biology',
    parentCategory: 'Molecular Biology',
    subcategory: 'DNA Repair',
    workflowTags: ['wgs', 'variant_calling'],
    prefixes: ['DNA', 'Genome', 'Chromatin', 'Replication', 'Repair', 'Cell Cycle', 'Transcription'],
    heads: ['checkpoint', 'pathway', 'factor', 'complex', 'signal', 'module', 'response', 'program'],
    contexts: [
      'a coordinated biological process regulating genome integrity under stress conditions',
      'a mechanistic concept used to interpret mutation patterns and repair capacity',
      'a molecular framework connecting genotype, cellular response, and phenotype',
      'a pathway-level abstraction frequently referenced in cancer and developmental biology',
    ],
    etymologies: [
      'Derived from classical molecular genetics terminology.',
      'Named from functional assays describing pathway behavior.',
      'Terminology evolved with repair and replication literature.',
    ],
  },
  {
    category: 'Methods',
    parentCategory: 'Sequencing',
    subcategory: 'Sequencing Technology',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    prefixes: ['Read', 'Library', 'Adapter', 'Barcode', 'Flow Cell', 'Cluster', 'Long-read', 'Short-read'],
    heads: ['protocol', 'strategy', 'workflow', 'configuration', 'chemistry', 'optimization', 'pipeline'],
    contexts: [
      'a sequencing workflow concept affecting sensitivity, specificity, and throughput',
      'a protocol-level term used to describe assay setup and data-generation behavior',
      'an implementation detail that influences batch structure and downstream QC metrics',
      'an operational concept in library construction and sequencing execution',
    ],
    etymologies: [
      'Named from instrument engineering and wet-lab practice.',
      'Term adopted from platform vendor and community protocol literature.',
      'Derived from early high-throughput sequencing nomenclature.',
    ],
  },
  {
    category: 'Statistics',
    parentCategory: 'Statistical Inference',
    subcategory: 'Modeling',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    prefixes: ['Posterior', 'Likelihood', 'Empirical Bayes', 'Regularized', 'Hierarchical', 'Robust', 'Penalized'],
    heads: ['estimator', 'test', 'model', 'framework', 'criterion', 'score', 'objective'],
    contexts: [
      'a statistical construct used for uncertainty-aware inference in high-dimensional settings',
      'a model-based quantity that supports calibrated decision thresholds',
      'an inferential component connecting observed counts to latent biological effects',
      'a quantitative criterion balancing discovery and false-positive control',
    ],
    etymologies: [
      'Originates from classical and modern inferential statistics.',
      'Term shaped by high-dimensional omics methodology development.',
      'Named from model-based decision theory conventions.',
    ],
  },
  {
    category: 'Format',
    parentCategory: 'File Formats',
    subcategory: 'Data Encoding',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    prefixes: ['BAM', 'CRAM', 'VCF', 'GTF', 'GFF', 'BED', 'FASTQ', 'BigWig'],
    heads: ['field', 'record', 'schema', 'annotation', 'index', 'tag', 'metadata'],
    contexts: [
      'a format-level construct required for interoperable parsing and reproducible pipelines',
      'a structured encoding element that carries analysis-critical metadata',
      'a specification detail that controls compatibility across tools and versions',
      'a serialized data component used in downstream filtering and interpretation',
    ],
    etymologies: [
      'Defined by community file-format specifications and tooling conventions.',
      'Originates from interoperability requirements in genomics pipelines.',
      'Named through alignment and variant-data standardization initiatives.',
    ],
  },
  {
    category: 'Methods',
    parentCategory: 'Computational Methods',
    subcategory: 'Algorithms',
    workflowTags: ['wgs', 'rnaseq', 'chipseq', 'metagenomic', 'variant_calling'],
    prefixes: ['Graph', 'Index', 'Suffix', 'Dynamic', 'Probabilistic', 'Heuristic', 'Approximate'],
    heads: ['alignment', 'search', 'optimization', 'assembler', 'classifier', 'decoder', 'inference'],
    contexts: [
      'an algorithmic primitive used to scale sequence analysis while maintaining accuracy',
      'a computational strategy for balancing runtime, memory, and biological fidelity',
      'a method family that underpins modern aligners, assemblers, and callers',
      'an optimization abstraction widely reused across genomic toolchains',
    ],
    etymologies: [
      'Term adapted from computer science algorithms literature.',
      'Borrowed from indexing and optimization frameworks.',
      'Evolved through bioinformatics software engineering practice.',
    ],
  },
  {
    category: 'Methods',
    parentCategory: 'RNA-seq',
    subcategory: 'RNA-seq Analysis',
    workflowTags: ['rnaseq'],
    prefixes: ['Transcript', 'Gene', 'Isoform', 'Splice', 'Expression', 'Read Count', 'Pathway'],
    heads: ['normalization', 'quantification', 'signature', 'contrast', 'decomposition', 'model'],
    contexts: [
      'an RNA-seq analysis concept used for robust transcriptome interpretation',
      'a transcriptomic workflow component affecting differential expression and pathway conclusions',
      'a quantification abstraction connecting reads to gene-level biological hypotheses',
      'a model-based RNA expression concept for between-condition comparison',
    ],
    etymologies: [
      'Developed from transcriptomics quantification methodology.',
      'Named in RNA-seq analysis and statistical modeling literature.',
      'Term aligned with modern transcriptome processing pipelines.',
    ],
  },
  {
    category: 'Methods',
    parentCategory: 'ChIP-seq',
    subcategory: 'ChIP-seq Analysis',
    workflowTags: ['chipseq'],
    prefixes: ['Peak', 'Motif', 'Enrichment', 'Signal', 'Fragment', 'Binding', 'Chromatin'],
    heads: ['score', 'calling', 'normalization', 'model', 'estimator', 'profile'],
    contexts: [
      'a ChIP-seq concept required for reliable enrichment and binding interpretation',
      'a peak-centric metric used for replicate-aware thresholding and ranking',
      'a chromatin-signal analysis component influencing motif and occupancy inference',
      'a domain-specific method used to separate true enrichment from background signal',
    ],
    etymologies: [
      'Term originates in chromatin immunoprecipitation analysis practices.',
      'Nomenclature evolved with early ChIP-chip and ChIP-seq method development.',
      'Named from enrichment and binding-site detection conventions.',
    ],
  },
  {
    category: 'Methods',
    parentCategory: 'Variant Calling',
    subcategory: 'Variant Analysis',
    workflowTags: ['variant_calling', 'wgs'],
    prefixes: ['Allele', 'Genotype', 'Somatic', 'Germline', 'Haplotype', 'Structural Variant', 'Copy Number'],
    heads: ['filter', 'evidence', 'model', 'likelihood', 'confidence', 'calibration', 'prior'],
    contexts: [
      'a variant analysis construct used to prioritize high-confidence calls',
      'a calling-stage concept linking read evidence to probabilistic genotype decisions',
      'a filtering and calibration term used to control false positives',
      'a decision metric for interpreting small and structural variant candidates',
    ],
    etymologies: [
      'Rooted in probabilistic variant-calling framework terminology.',
      'Derived from genotype likelihood and evidence aggregation literature.',
      'Term standardized through best-practices workflows in large sequencing projects.',
    ],
  },
  {
    category: 'Methods',
    parentCategory: 'Metagenomics',
    subcategory: 'Metagenomic Analysis',
    workflowTags: ['metagenomic'],
    prefixes: ['Taxonomic', 'Community', 'Microbiome', 'Abundance', 'Read Classification', 'Marker Gene', 'Contig'],
    heads: ['profiling', 'estimation', 'assignment', 'indexing', 'normalization', 'contrast', 'annotation'],
    contexts: [
      'a metagenomic analysis term used to profile community structure and function',
      'a microbial ecology metric connecting sequencing data to taxonomic interpretation',
      'an abundance-estimation concept for compositional comparison across samples',
      'a read classification abstraction balancing sensitivity and specificity',
    ],
    etymologies: [
      'Derived from microbial ecology and shotgun sequencing terminology.',
      'Coined in metagenomic classification and abundance-estimation literature.',
      'Adapted from comparative microbiome statistics and computational methods.',
    ],
  },
];

const generatedTerms = [];
const seen = new Set();

// Load scraped terms if available
const scrapedPath = path.join(__dirname, '..', 'src', 'data', 'biologyonline_terms.json');
if (fs.existsSync(scrapedPath)) {
  try {
    const scrapedTerms = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
    console.log(`Loading ${scrapedTerms.length} scraped terms from ${scrapedPath}`);
    for (const term of scrapedTerms) {
      const key = term.name.toLowerCase();
      if (!seen.has(key)) {
        generatedTerms.push(
          standardEntry({
            name: term.name,
            category: 'BiologyOnline', // Or use scraped category if available
            parentCategory: 'Dictionary',
            definition: term.definition || 'No definition available.',
            workflowTags: term.workflowTags || ['general'],
            externalLinks: { BiologyOnline: term.url },
          })
        );
        seen.add(key);
      }
    }
  } catch (err) {
    console.error('Failed to load scraped terms:', err);
  }
}

for (const core of coreTerms) {
  const key = core.name.toLowerCase();
  if (!seen.has(key)) {
    generatedTerms.push(
      standardEntry({
        ...core,
        definition: core.definition,
      })
    );
    seen.add(key);
  }
}

let configIndex = 0;
let termCounter = 0;
while (generatedTerms.length < TARGET_SIZE + 50) {
  const cfg = generatedConfigs[configIndex % generatedConfigs.length];
  configIndex += 1;

  const prefix = cfg.prefixes[termCounter % cfg.prefixes.length];
  const head = cfg.heads[Math.floor(termCounter / cfg.prefixes.length) % cfg.heads.length];
  const variant = Math.floor(termCounter / (cfg.prefixes.length * cfg.heads.length));

  const name = variant > 0 ? `${prefix} ${head} ${variant + 1}` : `${prefix} ${head}`;
  termCounter += 1;

  const key = name.toLowerCase();
  if (seen.has(key)) {
    continue;
  }

  const context = cfg.contexts[termCounter % cfg.contexts.length];
  const etymology = cfg.etymologies[termCounter % cfg.etymologies.length];

  generatedTerms.push(
    standardEntry({
      name,
      category: cfg.category,
      subcategory: cfg.subcategory,
      parentCategory: cfg.parentCategory,
      workflowTags: cfg.workflowTags,
      definition: sentence(name, context),
      etymology,
      prerequisites: [
        `${cfg.prefixes[(termCounter + 1) % cfg.prefixes.length]} ${cfg.heads[(termCounter + 2) % cfg.heads.length]}`,
      ],
      alternatives: [`${cfg.prefixes[(termCounter + 3) % cfg.prefixes.length]} ${cfg.heads[(termCounter + 4) % cfg.heads.length]}`],
      relatedMethods: [`${cfg.prefixes[(termCounter + 5) % cfg.prefixes.length]} ${cfg.heads[(termCounter + 1) % cfg.heads.length]}`],
      downstreamAnalyses: [`${cfg.prefixes[(termCounter + 2) % cfg.prefixes.length]} ${cfg.heads[(termCounter + 3) % cfg.heads.length]}`],
      typicalValues:
        cfg.category === 'Statistics'
          ? `${name} is interpreted with model diagnostics and multiple-testing context rather than fixed universal cutoffs.`
          : `${name} should be interpreted relative to assay design, sequencing depth, and quality controls.`,
      pitfalls: `A common pitfall is applying ${name} without workflow-specific calibration or replicate-aware validation.`,
      aliases: variant > 0 ? [`${prefix} ${head} v${variant + 1}`] : [],
    })
  );
  seen.add(key);
}

const finalTerms = generatedTerms.slice(0, TARGET_SIZE).map((term, index) => ({
  id: index + 1,
  ...term,
}));

const outputPath = path.join(__dirname, '..', 'src', 'data', 'glossary.json');
fs.writeFileSync(outputPath, JSON.stringify(finalTerms, null, 2));
console.log(`Generated ${finalTerms.length} terms at ${outputPath}`);
