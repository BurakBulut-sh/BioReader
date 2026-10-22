import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function generateRichPdf() {
  const doc = await PDFDocument.create();
  
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const _fontSans = await doc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryInk = rgb(0.08, 0.08, 0.07); // #141413
  const secondaryInk = rgb(0.27, 0.26, 0.25); // #44403C
  const mutedInk = rgb(0.47, 0.45, 0.43); // #78716C
  const emeraldAccent = rgb(0.02, 0.37, 0.27); // #065F46
  const borderStone = rgb(0.85, 0.83, 0.80); // #D6D3D1
  const bgSubtle = rgb(0.97, 0.96, 0.94); // #FAF9F5

  const pageWidth = 595.28; // A4 standard
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  function addHeaderFooter(page, pageNum, totalPages) {
    // Top running header
    page.drawLine({
      start: { x: margin, y: pageHeight - 38 },
      end: { x: pageWidth - margin, y: pageHeight - 38 },
      thickness: 0.75,
      color: borderStone,
    });
    page.drawText('JOURNAL OF COMPUTATIONAL BIOLOGY & EVOLUTIONARY GENOMICS', {
      x: margin,
      y: pageHeight - 32,
      size: 7.5,
      font: fontSansBold,
      color: mutedInk,
    });
    page.drawText('RESEARCH ARTICLE', {
      x: pageWidth - margin - 85,
      y: pageHeight - 32,
      size: 7.5,
      font: fontSansBold,
      color: emeraldAccent,
    });

    // Bottom running footer
    page.drawLine({
      start: { x: margin, y: 44 },
      end: { x: pageWidth - margin, y: 44 },
      thickness: 0.75,
      color: borderStone,
    });
    page.drawText('Bulut et al. | Chironomus riparius De Novo Mutation Landscape', {
      x: margin,
      y: 32,
      size: 8,
      font: fontItalic,
      color: mutedInk,
    });
    page.drawText(`Page ${pageNum} of ${totalPages}`, {
      x: pageWidth - margin - 55,
      y: 32,
      size: 8,
      font: fontMono,
      color: primaryInk,
    });
  }

  // ================= PAGE 1 =================
  const page1 = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 65;

  // Metadata badge
  page1.drawRectangle({
    x: margin,
    y: y - 16,
    width: 140,
    height: 18,
    color: bgSubtle,
    borderColor: borderStone,
    borderWidth: 0.75,
  });
  page1.drawText('PEER-REVIEWED RESEARCH', {
    x: margin + 8,
    y: y - 11,
    size: 7,
    font: fontSansBold,
    color: emeraldAccent,
  });
  page1.drawText('DOI: 10.1038/s41586-026-08112-x', {
    x: margin + 155,
    y: y - 11,
    size: 7.5,
    font: fontMono,
    color: mutedInk,
  });

  y -= 38;

  // Article Title
  const title1 = 'High-Throughput Whole-Genome Sequencing and De Novo';
  const title2 = 'Mutation Landscape in Chironomus riparius';
  page1.drawText(title1, { x: margin, y, size: 17, font: fontBold, color: primaryInk });
  y -= 22;
  page1.drawText(title2, { x: margin, y, size: 17, font: fontBold, color: primaryInk });

  y -= 20;

  // Authors
  page1.drawText('Burak Bulut, Ph.D.', { x: margin, y, size: 10.5, font: fontBold, color: primaryInk });
  page1.drawText('1,2,*', { x: margin + 98, y: y + 3, size: 7.5, font: fontBold, color: emeraldAccent });
  page1.drawText(', Elena Rostova, M.Sc.', { x: margin + 112, y, size: 10.5, font: fontRegular, color: secondaryInk });
  page1.drawText('1', { x: margin + 225, y: y + 3, size: 7.5, font: fontRegular, color: mutedInk });
  page1.drawText(', Marcus Vance, Ph.D.', { x: margin + 233, y, size: 10.5, font: fontRegular, color: secondaryInk });
  page1.drawText('3', { x: margin + 348, y: y + 3, size: 7.5, font: fontRegular, color: mutedInk });

  y -= 15;

  // Affiliations
  page1.drawText('1. Department of Evolutionary Genomics, Max Planck Institute for Biology, Tubingen, Germany', {
    x: margin,
    y,
    size: 8,
    font: fontRegular,
    color: mutedInk,
  });
  y -= 11;
  page1.drawText('2. Computational Biology & Systems AI Laboratory, Goethe University, Frankfurt am Main, Germany', {
    x: margin,
    y,
    size: 8,
    font: fontRegular,
    color: mutedInk,
  });
  y -= 11;
  page1.drawText('3. European Molecular Biology Laboratory (EMBL), Heidelberg, Germany. *Email: burak.buluut@outlook.com', {
    x: margin,
    y,
    size: 8,
    font: fontRegular,
    color: mutedInk,
  });

  y -= 18;

  // Abstract Box
  const abstractBoxY = y - 145;
  page1.drawRectangle({
    x: margin,
    y: abstractBoxY,
    width: contentWidth,
    height: 145,
    color: bgSubtle,
    borderColor: borderStone,
    borderWidth: 0.75,
  });

  page1.drawText('ABSTRACT', {
    x: margin + 14,
    y: y - 18,
    size: 9,
    font: fontSansBold,
    color: emeraldAccent,
  });

  const abstractText = [
    'We investigate the de novo germline mutation rate and somatic variant accumulation in Chironomus riparius',
    'under acute heavy metal environmental selection pressure. Using whole-genome sequencing (WGS) on the Illumina',
    'NovaSeq 6000 platform with 60x coverage across multi-generational lineages, we identified 1,428 high-confidence',
    'single nucleotide variants (SNVs) and 184 small insertions/deletions. High-throughput bioinformatic processing was',
    'orchestrated through GATK4 HaplotypeCaller, BWA-MEM read alignment, and rigorous quality filtering (MAPQ >= 40,',
    'DP >= 25, QD < 2.0). Our results show an elevated transition-to-transversion (Ti/Tv) ratio of 2.34 and an estimated',
    'spontaneous mutation rate of 3.12 x 10^-9 per site per generation. Differential gene expression (RNA-seq) revealed',
    'coordinated upregulation of heat shock protein families (Hsp70, Cyp450). This study provides foundational genomic',
    'resources and benchmark mutation rates for environmental sentinel dipterans.',
  ];

  let absY = y - 33;
  for (const line of abstractText) {
    page1.drawText(line, { x: margin + 14, y: absY, size: 8.5, font: fontRegular, color: primaryInk });
    absY -= 11.5;
  }

  page1.drawText('Keywords: Chironomus riparius, whole-genome sequencing (WGS), de novo mutation, heterozygosity, variant calling, GATK, Illumina, FASTQ.', {
    x: margin + 14,
    y: absY - 3,
    size: 7.8,
    font: fontItalic,
    color: mutedInk,
  });

  y = abstractBoxY - 26;

  // Section 1: Introduction
  page1.drawText('1. INTRODUCTION', { x: margin, y, size: 11, font: fontSansBold, color: primaryInk });
  y -= 14;

  const introText = [
    'Understanding the baseline rates of spontaneous mutations and how environmental stressors perturb genomic stability',
    'is a central question in evolutionary genetics and ecotoxicology. Non-biting midges of the genus Chironomus, particularly',
    'Chironomus riparius, are ubiquitous freshwater macroinvertebrates widely utilized as bioindicators of sediment toxicity',
    'and aquatic environmental quality. Despite extensive phenotypic characterization, the precise rate of de novo germline',
    'mutations and their distribution across the nuclear genome have remained poorly quantified due to the historical scarcity',
    'of high-continuity reference assemblies.',
    '',
    'Next-generation high-throughput sequencing has fundamentally transformed non-model genomics. By leveraging deeply',
    'sequenced parent-offspring trios and multi-generational lineages, it is now feasible to detect true de novo mutations with high',
    'statistical specificity while mitigating false discovery rates caused by sequencing errors or PCR amplification artifacts.',
    'In this investigation, we established a rigorous variant calling pipeline conforming to GATK best practices, coupled with',
    'automated quality control and high-performance computing (HPC) workflows.',
  ];

  for (const line of introText) {
    if (line === '') {
      y -= 7;
      continue;
    }
    page1.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  // ================= PAGE 2 =================
  const page2 = doc.addPage([pageWidth, pageHeight]);
  y = pageHeight - 65;

  page2.drawText('2. MATERIALS AND METHODS', { x: margin, y, size: 11, font: fontSansBold, color: primaryInk });
  y -= 16;

  page2.drawText('2.1 Biological Sampling and Colony Maintenance', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const mm1 = [
    'Chironomus riparius egg clutches were sampled from uncontaminated reference sites in Central Europe and reared under',
    'controlled climate chamber conditions (20 +/- 1 deg C, 16:8 light:dark photoperiod). Five independent pedigree lineages',
    'were maintained across 10 generations under standard laboratory conditions (Lineages L01 to L05), while two parallel lineages',
    'were subjected to sublethal cadmium acetate exposure (0.5 ug/L) to simulate persistent environmental stress.',
  ];
  for (const line of mm1) {
    page2.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  y -= 8;
  page2.drawText('2.2 High-Throughput DNA Extraction and Illumina Sequencing', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const mm2 = [
    'High-molecular-weight genomic DNA was extracted from individual adult specimens using the Qiagen MagAttract HMW DNA Kit.',
    'Paired-end sequencing libraries with an average insert size of 380 bp were prepared using the Illumina TruSeq DNA PCR-Free',
    'protocol to minimize library amplification bias. Deep sequencing was conducted on an Illumina NovaSeq 6000 sequencer,',
    'yielding an average of 42.5 million 150 bp paired-end read pairs per individual (approximately 60x nominal coverage).',
  ];
  for (const line of mm2) {
    page2.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  y -= 8;
  page2.drawText('2.3 Computational Pipeline, Alignment, and Variant Calling', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const mm3 = [
    'Raw FASTQ files were subjected to automated quality control using fastp (v0.23.4) with parameters --detect_adapter_for_pe',
    'and --qualified_quality_phred 30. High-quality filtered reads were aligned to the chromosome-level Chironomus riparius',
    'reference genome assembly (v2.1) using BWA-MEM (v0.7.17-r1188). Alignment files in BAM format were sorted and duplicates',
    'marked via Picard Tools (v3.1.1). Mapping quality scores (MAPQ) were evaluated across all genomic regions.',
    '',
    'Variant calling was executed using GATK4 HaplotypeCaller (v4.5.0) in GVCF mode across each lineage cohort, followed by',
    'joint genotyping via GenotypeGVCFs. Stringent variant quality score recalibration and hard filtering thresholds were applied:',
    'Quality by Depth (QD >= 2.0), Fisher Strand (FS <= 60.0), Mapping Quality (MQ >= 40.0), and ReadPosRankSum >= -8.0.',
    'Candidate de novo mutations were confirmed by checking that alternate alleles were absent in both parental samples and present',
    'in at least 25% of reads in the focal progeny with a minimum read depth (DP) of 25x.',
  ];
  for (const line of mm3) {
    if (line === '') {
      y -= 6;
      continue;
    }
    page2.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  y -= 8;
  page2.drawText('2.4 High-Performance Cluster Orchestration and SLURM Architecture', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const mm4 = [
    'All analytical steps were modularized into reproducible Snakemake workflows deployed on an institutional SLURM HPC',
    'cluster. Resource allocations were monitored in real time using PipeWatch telemetry to guarantee deterministic resource bounds,',
    'while sample provenance and checksum verifications were enforced via SampleSheriff CLI checkpoints.',
  ];
  for (const line of mm4) {
    page2.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  // ================= PAGE 3 =================
  const page3 = doc.addPage([pageWidth, pageHeight]);
  y = pageHeight - 65;

  page3.drawText('3. RESULTS', { x: margin, y, size: 11, font: fontSansBold, color: primaryInk });
  y -= 16;

  page3.drawText('3.1 Genome-Wide Sequencing Depth and Variant Calling Summary', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const res1 = [
    'Across all sequenced individuals, we achieved an average mapping rate of 98.4% and an effective mean coverage depth of 58.2x.',
    'In total, 1,428 high-confidence de novo single nucleotide variants were validated across 10 generations. Table 1 summarizes',
    'the sequencing yield, alignment efficiency, transition-to-transversion ratios, and estimated heterozygosity.',
  ];
  for (const line of res1) {
    page3.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  y -= 10;

  // Table 1
  page3.drawText('Table 1. Whole-genome sequencing yield, alignment metrics, and variant statistics across Chironomus lineages.', {
    x: margin,
    y,
    size: 8.5,
    font: fontBold,
    color: primaryInk,
  });
  y -= 16;

  // Table header background
  page3.drawRectangle({
    x: margin,
    y: y - 18,
    width: contentWidth,
    height: 20,
    color: bgSubtle,
    borderColor: borderStone,
    borderWidth: 0.75,
  });

  const cols = [
    { name: 'Lineage ID', x: margin + 8, w: 70 },
    { name: 'Reads (M)', x: margin + 85, w: 55 },
    { name: 'Mapped (%)', x: margin + 145, w: 60 },
    { name: 'Depth (X)', x: margin + 215, w: 55 },
    { name: 'Ti/Tv Ratio', x: margin + 275, w: 65 },
    { name: 'De Novo SNVs', x: margin + 345, w: 75 },
    { name: 'Heterozygosity', x: margin + 425, w: 70 },
  ];

  for (const col of cols) {
    page3.drawText(col.name, { x: col.x, y: y - 13, size: 7.5, font: fontSansBold, color: primaryInk });
  }

  y -= 18;

  const tableData = [
    ['L01 (Control)', '44.2', '98.7%', '62.4x', '2.31', '284', '0.0078'],
    ['L02 (Control)', '41.8', '98.5%', '59.1x', '2.35', '276', '0.0075'],
    ['L03 (Control)', '43.1', '98.3%', '60.8x', '2.28', '291', '0.0081'],
    ['L04 (Cadmium Stress)', '46.0', '97.9%', '64.9x', '2.44', '398', '0.0094'],
    ['L05 (Cadmium Stress)', '42.9', '98.1%', '60.5x', '2.41', '379', '0.0092'],
  ];

  for (let r = 0; r < tableData.length; r++) {
    const row = tableData[r];
    const rowY = y - 16;
    if (r % 2 === 1) {
      page3.drawRectangle({
        x: margin,
        y: rowY - 4,
        width: contentWidth,
        height: 18,
        color: bgSubtle,
      });
    }
    page3.drawLine({
      start: { x: margin, y: rowY - 4 },
      end: { x: pageWidth - margin, y: rowY - 4 },
      thickness: 0.5,
      color: borderStone,
    });

    for (let c = 0; c < row.length; c++) {
      page3.drawText(row[c], {
        x: cols[c].x,
        y: rowY + 1,
        size: 8,
        font: c === 0 ? fontBold : fontMono,
        color: c === 5 && r >= 3 ? emeraldAccent : primaryInk,
      });
    }
    y -= 18;
  }

  y -= 16;

  page3.drawText('3.2 Mutation Rate Spectrum and Environmental Impact', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const res2 = [
    'The overall spontaneous de novo mutation rate in unexposed control lineages was estimated at mu = (3.12 +/- 0.28) x 10^-9',
    'per base pair per generation. In contrast, lineages subjected to chronic cadmium exposure exhibited a statistically significant',
    '38% elevation in germline mutation frequency (mu = 4.31 x 10^-9, Student t-test p = 0.00034). Analysis of the mutational',
    'spectrum revealed a preponderance of C:G -> T:A transitions, characteristic of oxidative DNA damage and cytosine deamination.',
  ];
  for (const line of res2) {
    page3.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  y -= 10;
  page3.drawText('3.3 Differential Gene Expression in Stress Response Pathways', { x: margin, y, size: 9.5, font: fontBold, color: secondaryInk });
  y -= 13;
  const res3 = [
    'RNA-seq profiling of whole larvae under identical treatment regimens demonstrated significant differential gene expression',
    '(FDR < 0.01) across 412 genes. Transcripts encoding heat shock protein 70 (Hsp70) and cytochrome P450 monooxygenases (Cyp450)',
    'showed >4.5-fold induction in cadmium-exposed lines, correlating with localized somatic mutation hotspots.',
  ];
  for (const line of res3) {
    page3.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  // ================= PAGE 4 =================
  const page4 = doc.addPage([pageWidth, pageHeight]);
  y = pageHeight - 65;

  page4.drawText('4. DISCUSSION & REPRODUCIBILITY', { x: margin, y, size: 11, font: fontSansBold, color: primaryInk });
  y -= 16;

  const discText = [
    'Our empirical quantification of the Chironomus riparius mutation rate places this sentinel species within the evolutionary',
    'envelope observed for Diptera, intermediate between Drosophila melanogaster (2.8 x 10^-9) and Heliconius melpomene (2.9 x 10^-9).',
    'The marked acceleration of point mutations under environmental xenobiotic exposure underscores the sensitivity of eukaryotic',
    'mismatch repair mechanisms to toxic heavy metal ions.',
    '',
    'From a computational methodology perspective, non-model genomic investigations frequently grapple with fragmented assemblies',
    'and elevated heterozygosity that generate false-positive structural variant calls. By strictly enforcing joint genotyping,',
    'high mapping quality thresholds (MAPQ >= 40), and independent biological replicate cohorts, we eliminated over 94% of spurious',
    'candidate loci. The integration of containerized workflows and real-time execution monitoring ensures complete auditability',
    'and compliance with FAIR (Findable, Accessible, Interoperable, and Reusable) scientific principles.',
  ];
  for (const line of discText) {
    if (line === '') {
      y -= 6;
      continue;
    }
    page4.drawText(line, { x: margin, y, size: 9, font: fontRegular, color: primaryInk });
    y -= 12.5;
  }

  y -= 12;

  page4.drawText('5. REFERENCES', { x: margin, y, size: 11, font: fontSansBold, color: primaryInk });
  y -= 14;

  const refs = [
    '[1] Bulut, B., Oppold, A., & Pfenninger, M. (2024). Ecotoxicogenomics of non-biting midges. Environmental Pollution, 312, 119842.',
    '[2] Li, H., & Durbin, R. (2009). Fast and accurate short read alignment with Burrows-Wheeler transform. Bioinformatics, 25(14), 1754-1760.',
    '[3] McKenna, A., et al. (2010). The Genome Analysis Toolkit: a MapReduce framework for analyzing next-generation DNA sequencing data.',
    '    Genome Research, 20(9), 1297-1303.',
    '[4] Pfenninger, M., et al. (2022). Chromosome-scale reference genome of Chironomus riparius. BMC Genomics, 23, 412.',
    '[5] Keightley, P. D., et al. (2014). Analysis of the genome sequences of three Drosophila melanogaster laboratory strains. Genetics, 196(1), 313-323.',
    '[6] Chen, S., et al. (2018). fastp: an ultra-fast all-in-one FASTQ preprocessor. Bioinformatics, 34(17), i884-i890.',
    '[7] Oppold, A. M., et al. (2015). Epigenetic regulation of temperature adaptation in Chironomus riparius. Molecular Ecology, 24(12), 3020-3032.',
    '[8] Robinson, J. T., et al. (2011). Integrative genomics viewer. Nature Biotechnology, 29(1), 24-26.',
  ];

  for (const ref of refs) {
    page4.drawText(ref, { x: margin, y, size: 8, font: fontRegular, color: secondaryInk });
    y -= 11.5;
  }

  y -= 14;

  // Data Availability Box
  page4.drawRectangle({
    x: margin,
    y: y - 50,
    width: contentWidth,
    height: 50,
    color: bgSubtle,
    borderColor: borderStone,
    borderWidth: 0.75,
  });

  page4.drawText('DATA & CODE AVAILABILITY', {
    x: margin + 12,
    y: y - 14,
    size: 7.5,
    font: fontSansBold,
    color: emeraldAccent,
  });
  page4.drawText('Raw sequencing reads: NCBI SRA under BioProject PRJNA984120. Variant callsets (VCFs) and Snakemake', {
    x: margin + 12,
    y: y - 27,
    size: 8,
    font: fontRegular,
    color: primaryInk,
  });
  page4.drawText('pipelines are accessible on Zenodo (10.5281/zenodo.823910) and GitHub: https://github.com/BurakBulut-sh/BioReader.', {
    x: margin + 12,
    y: y - 39,
    size: 8,
    font: fontMono,
    color: mutedInk,
  });

  // Stamp headers and footers across all 4 pages
  addHeaderFooter(page1, 1, 4);
  addHeaderFooter(page2, 2, 4);
  addHeaderFooter(page3, 3, 4);
  addHeaderFooter(page4, 4, 4);

  const pdfBytes = await doc.save();
  const outPath = path.join(process.cwd(), 'fixtures', 'chironomus_mutation_study.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log('Successfully generated rich test PDF at:', outPath);
}

generateRichPdf().catch(err => {
  console.error('Failed to generate rich PDF:', err);
  process.exit(1);
});
