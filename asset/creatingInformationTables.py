import re
import sqlite3

def createProteinInformationTable(dbFile = "asset/protein_index.db", fastaFile = "asset/uniprot_sprot.fasta"):
    # regular expression pattern explanation:
    #   - ^>sp\| : Ensures the header starts with ">sp|"
    #   - (?P<protein_id>[^|]+) : Captures protein_id (everything until the next '|')
    #   - \|(?P<protein_name>\S+) : Captures protein_name (next token with no whitespace)
    #   - \s+(?P<type>.*?)(?=\s+(OS=|OX=|GN=|PE=|SV=)|$) : Lazily captures the type (description) until a field keyword (or end-of-line)
    #   - (?:\s+OS=(?P<os>.*?))? : Optionally captures the OS field (value can include spaces)
    #   - (?:\s+OX=(?P<ox>\S+))? : Optionally captures the OX field (a non-whitespace value)
    #   - (?:\s+GN=(?P<gn>.*?))? : Optionally captures the GN field (value can include spaces)
    #   - (?:\s+PE=(?P<pe>\S+))? : Optionally captures the PE field (a non-whitespace value)
    #   - (?:\s+SV=(?P<sv>\S+))? : Optionally captures the SV field (a non-whitespace value)
    #   - $ : End of line
    pattern = re.compile(
        r"^>sp\|(?P<protein_id>[^|]+)\|(?P<protein_name>\S+)\s+"
        r"(?P<type>.*?)(?=\s+(OS=|OX=|GN=|PE=|SV=)|$)"
        r"(?:\s+OS=(?P<os>.*?))?"
        r"(?:\s+OX=(?P<ox>\S+))?"
        r"(?:\s+GN=(?P<gn>.*?))?"
        r"(?:\s+PE=(?P<pe>\S+))?"
        r"(?:\s+SV=(?P<sv>\S+))?"
        r"$"
    )

    conn = sqlite3.connect(dbFile)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS protein_info")
    cur.execute("""
        CREATE TABLE protein_info (
            protein_id TEXT,
            protein_name TEXT PRIMARY KEY,
            type TEXT,
            os TEXT,
            ox TEXT,
            gn TEXT,
            pe TEXT,
            sv TEXT
        )
    """)
    conn.commit()

    with open(fastaFile, "r") as file:
        for line in file:
            line = line.strip()
            if line.startswith(">sp|"):
                match = pattern.match(line)
                if match:
                    record = match.groupdict()
                    cur.execute("""
                        INSERT INTO protein_info (protein_id, protein_name, type, os, ox, gn, pe, sv)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        record.get("protein_id"),
                        record.get("protein_name"),
                        record.get("type"),
                        record.get("os"),
                        record.get("ox"),
                        record.get("gn"),
                        record.get("pe"),
                        record.get("sv")
                    ))
                else:
                    print("Header line did not match expected format:", line)

    conn.commit()
    conn.close()

createProteinInformationTable()