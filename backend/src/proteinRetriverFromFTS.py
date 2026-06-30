import sqlite3
import pandas as pd
import re
from collections import defaultdict
import spacy

# python -m spacy download en_core_web_sm)
nlp = spacy.load("en_core_web_sm")

SYNONYM_MAP = {
    "cofactor": ["coenzyme", "co-factor", "co enzyme"],
    "pathway": ["biopathway", "biosynthesis", "route"],
    "activity": ["function", "activity", "action"],
    "catalytic": ["enzymatic", "enzyme-driven"],
    "protein": ["polypeptide", "gene product"]
}

def expand_synonyms(text):
    expanded = [text]
    for key, synonyms in SYNONYM_MAP.items():
        if key in text:
            expanded.extend(synonyms)
    return list(set(expanded))

def sanitize_fts_term(term: str) -> str:
    # Replace problematic special characters with spaces
    sanitized = term.replace("-", " ").replace("_", " ")
    return sanitized

def retrieveRelatedProteinsFTS(query, top_k=10, db_path="asset/protein_index2.db"):
    stopwords = {'what', 'which', 'who', 'are', 'is', 'the', 'of', 'in', 'on', 'to', 'there', 'those', 'this', 'these',
                 'and', 'information', 'a', 'an', 'do', 'does', 'can', 'could', 'should', 'would', 'please', 'just',
                 'only', 'also', 'even', 'still', 'yet', 'already', 'however', 'how', 'when', 'where', 'why', 'at', 
                 'by', 'for', 'from', 'with', 'about', 'as', 'into', 'like', 'through', 'over', 'before', 'after', 
                 'above', 'below', 'between', 'but', 'or', 'nor', 'so', 'if', 'than', 'because', 'he', 'she', 'it', 
                 'they', 'we', 'you', 'him', 'her', 'them', 'us', 'your', 'my', 'our', 'was', 'were', 'be', 'been', 
                 'being', 'has', 'have', 'had', 'will', 'shall', 'may', 'might', 'must', 'let'
                 }

    query = query.lower()
    query = re.sub(r'[.,;!?()\[\]]', ' and ', query)
    parts = re.split(r'\band\b', query)

    subqueries = []
    for part in parts:
        words = re.findall(r'\w+', part)
        keywords = [w for w in words if w not in stopwords]
        if keywords:
            base = ' '.join(keywords)
            expanded = expand_synonyms(base)
            subqueries.append((base, expanded))

    if not subqueries:
        print("No valid search terms found.")
        return pd.DataFrame(columns=["Protein ID", "Content"])

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    score_map = defaultdict(lambda: {"content": "", "score": 0})

    try:
        for base_query, expansions in subqueries:
            # more specific (longer query) = higher weight
            weight = 1 + 1 / max(1, len(base_query.split()))

            for fts_query in expansions:
                safe_query = sanitize_fts_term(fts_query)
                cursor.execute("""
                    SELECT content
                    FROM flat_files_fts
                    WHERE flat_files_fts MATCH ?
                    LIMIT ?;
                """, (safe_query, top_k))

                for row in cursor.fetchall():
                    content = row[0]
                    match = re.search(r'^AC\s+(\w+);', content, re.MULTILINE)
                    if match:
                        protein_id = match.group(1)
                        # accumulate score
                        score_map[protein_id]["content"] = content
                        score_map[protein_id]["score"] += weight

        if not score_map:
            return pd.DataFrame(columns=["Protein ID", "Content"])

        sorted_items = sorted(score_map.items(), key=lambda x: x[1]["score"], reverse=True)

        results = [(pid, val["content"]) for pid, val in sorted_items[:top_k]]

        df = pd.DataFrame(results, columns=["Protein ID", "Content"])
        return df.reset_index(drop=True)

    except sqlite3.Error as e:
        print(f"SQLite ERROR: {e}")
        return pd.DataFrame(columns=["Protein ID", "Content"])

    finally:
        conn.close()
