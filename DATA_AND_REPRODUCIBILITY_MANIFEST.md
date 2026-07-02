# PROQUEST Data and Reproducibility Manifest

This document captures the main data artifacts used by PROQUEST together the scripts used to regenerate or rebuild them. It is intended for paper reproducibility, data sharing, and re-running the project with a different dataset or environment.


---

## 1. Purpose of this document

The repository contains many large artifacts, including the main SQLite database, embedding indexes, BM25 cache files, sequence indexes, and vector-store data. For publication, replication, or external reuse, it is important to record:

- the exact files that belong to the project,
- their exact sizes and checksums,
- the scripts that generate or depend on them,
- the source inputs required to rebuild them.

---

## 2. Files to archive for publication or transfer

The following files and folders should be included in a data bundle if the full project state is intended to be reproduced:

- backend/asset/
- config/
- backend/src/

The most important archive targets are the files in backend/asset, because they contain the precomputed indexes and database state used at runtime.

---

## 3. Exact artifact inventory

| Artifact | Purpose | Rebuild / dependency script(s) | Notes |
|---|---|---|---|
| backend/asset/protein_index2.db | Main SQLite database used by the backend for metadata, field definitions, protein tables, and flat-file mappings. | config/setUpDatabase.py, config/createInformationTables.py, config/addGoAnnotations.py | Core runtime database. |
| backend/asset/protein_embeddings_2.ann | Annoy nearest-neighbor index for sequence embedding search. | config/implementVectorDatabase.py | Built by the Annoy index creation workflow in implementVectorDatabase.py. |
| backend/asset/docs_sp.joblib | Preprocessed BM25 document cache used to speed up retrieval. | backend/src/proteinRetriverFromBM25.py | Generated from flat-file content and BM25 encoder. |
| backend/asset/bm25_model_fromflatfiles.pkl | BM25 encoder model for sparse retrieval. | config/buildBM25Tokenizer.py | Built over flat-file content stored in the database. |
| backend/asset/search-fields.json | Search-field schema used by the backend and DB initialization. | config/setUpDatabase.py | Loaded into the SQLite DB. |
| backend/asset/result-fields.json | Result-field schema used by the backend. | config/setUpDatabase.py | Loaded into the SQLite DB. |
| backend/asset/queryfields.txt | Plain-text query field definitions. | None; static reference data | Useful as a lightweight schema reference. |
| backend/asset/query-fields.md | Markdown documentation of query fields. | None; static reference data | Useful for documentation and paper references. |
| backend/asset/uniprot_sprot.fasta | Raw UniProt FASTA source used for sequence information and indexing. | config/createInformationTables.py, config/implementVectorDatabaseFromFlatFiles.py | Primary biological input. |
| backend/asset/chroma_uniprot_nomic/chroma.sqlite3 | Persisted Chroma vector database file. | config/implementVectorDatabaseFromFlatFiles.py, backend/src/proteinRetriverFromFlatFiles.py | Used by the flat-file retrieval pipeline. |

### External inputs used by rebuild workflows

| External input | Typical role | Required by |
|---|---|---|
| asset/per-protein.h5 | Source embeddings for Annoy index construction. | config/implementVectorDatabase.py |
| uniprot_sprot.dat or equivalent UniProt flat-file source | Source records for flat-file vector indexing and retrieval. | config/implementVectorDatabaseFromFlatFiles.py |
| goa_uniprot_all.gpa | GO annotation source file before filtering. | config/addGoAnnotations.py |
| go-basic.obo | GO ontology definitions used for enrichment workflows. | config/createInformationTables.py |

---

## 4. Rebuild and setup scripts

### 4.1 Environment setup

Main environment bootstrap script:

- config/setUpBackEndEnv.sh

This script creates a conda environment and installs the main Python dependencies needed for embeddings, Chroma, BM25, transformers, Annoy, spaCy, and PyTorch.

### 4.2 Database and metadata setup

Main scripts:

- config/setUpDatabase.py
- config/createInformationTables.py

These scripts create and populate the core SQLite database tables from the JSON field definitions and the FASTA protein records.

### 4.3 BM25 and sparse retrieval assets

Main scripts:

- config/buildBM25Tokenizer.py
- backend/src/proteinRetriverFromBM25.py

These scripts create the BM25 encoder and the preprocessed document cache used to speed up sparse retrieval.

### 4.4 Vector and embedding indexes

Main scripts:

- config/implementVectorDatabase.py
- config/implementVectorDatabaseFromFlatFiles.py

These scripts build the Annoy index and the Chroma vector store from embedding data and flat-file content.

### 4.5 GO annotation enrichment

Main script:

- config/addGoAnnotations.py

This script adds GO-based annotation mappings into the database when the relevant annotation files are available.

---

## 5. Recommended reproducibility workflow

1. Create the environment:
   - Run config/setUpBackEndEnv.sh

2. Initialize the DB and field tables:
   - Run config/setUpDatabase.py

3. Build protein information tables from the FASTA data:
   - Run config/createInformationTables.py

4. Build BM25 assets:
   - Run config/buildBM25Tokenizer.py

5. Build the vector database and embedding index:
   - Run config/implementVectorDatabaseFromFlatFiles.py
   - Run config/implementVectorDatabase.py

6. Enrich the DB with GO annotations:
   - Run config/addGoAnnotations.py

