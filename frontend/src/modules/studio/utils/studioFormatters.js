import React from 'react';

export function renderProteinLink(value) {
  return (
    <a href={`https://www.uniprot.org/uniprotkb/${value}`} target="_blank" rel="noreferrer">
      {value}
    </a>
  );
}

export function renderGoLink(value) {
  return (
    <a href={`https://www.ebi.ac.uk/QuickGO/term/${value}`} target="_blank" rel="noreferrer">
      {value}
    </a>
  );
}

export function buildLlmExportRows(results) {
  return results.map((item) => ({
    Accession: item.primaryAccession || '',
    'Protein Name': item.proteinDescription?.recommendedName?.fullName?.value || '',
    Gene: item.genes?.[0]?.geneName?.value || '',
    Organism: item.organism?.scientificName || '',
    Function: item.comments?.[0]?.texts?.[0]?.value || '',
  }));
}

export function summarizeTableValue(value, limit = 5) {
  const items = String(value ?? '').split(', ');
  const preview = items.slice(0, limit).join(', ');
  return items.length > limit ? `${preview}...` : preview;
}
