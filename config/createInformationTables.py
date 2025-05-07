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

#createProteinInformationTable()

def process_obo_file():
    db_path = "asset/protein_index.db"
    obo_file_path = "asset/go-basic.obo"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS go_info (
        go_id TEXT PRIMARY KEY,
        go_name TEXT,
        namespace TEXT,
        alt_id TEXT,
        def TEXT,
        comment TEXT,
        synonym TEXT,
        is_obsolete TEXT,
        replaced_by TEXT,
        consider TEXT,
        is_a TEXT
    );
    ''')
    conn.commit()

    with open(obo_file_path, 'r') as file:
        content = file.read()

    terms_section = content.split('[Term]')[1:]

    field_patterns = {
        'go_id': r'^id: (GO:\d+)',
        'go_name': r'^name: (.+)',
        'namespace': r'^namespace: (.+)',
        'alt_id': r'^alt_id: (GO:\d+)',
        'def': r'^def: "(.+?)" \[',
        'comment': r'^comment: (.+)',
        'synonym': r'^synonym: "(.+?)"',
        'is_obsolete': r'^is_obsolete: (true|false)',
        'replaced_by': r'^replaced_by: (GO:\d+)',
        'consider': r'^consider: (GO:\d+)',
        'is_a': r'^is_a: (GO:\d+)'
    }

    for term in terms_section:
        data = {field: [] for field in field_patterns}
        
        for field, pattern in field_patterns.items():
            matches = re.findall(pattern, term, re.MULTILINE)
            if matches:
                data[field] = matches
        
        for field, values in data.items():
            if values:
                data[field] = ', '.join(values)

        go_id = data['go_id']
        if go_id:  # skip duplicate go_id
            cursor.execute('''
            INSERT OR REPLACE INTO go_info (go_id, go_name, namespace, alt_id, def, comment, synonym, is_obsolete, replaced_by, consider, is_a)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['go_id'],
                data['go_name'] if data['go_name'] else None,
                data['namespace'] if data['namespace'] else None,
                data['alt_id'] if data['alt_id'] else None,
                data['def'] if data['def'] else None,
                data['comment'] if data['comment'] else None,
                data['synonym'] if data['synonym'] else None,
                data['is_obsolete'] if data['is_obsolete'] else None,
                data['replaced_by'] if data['replaced_by'] else None,
                data['consider'] if data['consider'] else None,
                data['is_a'] if data['is_a'] else None
            ))
        conn.commit()
    conn.close()
    

#process_obo_file()
#print("Database table 'go_info' created and populated successfully.")

def createBackgroundDistributionCountMaterializedView(dbPath):
    conn = sqlite3.connect(dbPath)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS background_distribution_count;")
    cursor.execute("CREATE TABLE background_distribution_count (go_id TEXT PRIMARY KEY, background_distribution INTEGER);")
    cursor.execute("""
        INSERT INTO background_distribution_count (go_id, background_distribution)
        SELECT go_id, COUNT(DISTINCT protein_id)
        FROM protein_go_mapping
        GROUP BY go_id;
    """)
    
    conn.commit()
    conn.close()


def createFlatFileMappingTable(dbPath):
    conn = sqlite3.connect(dbPath)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flat_files_mapping (
            protein_id TEXT PRIMARY KEY,
            file_id INTEGER,
            FOREIGN KEY (file_id) REFERENCES flat_files(file_id)
        )
    ''')

    cursor.execute('SELECT file_id, content FROM flat_files')
    records = cursor.fetchall()

    for fileId, content in records:
        match = re.search(r'^AC\s+(\w+);', content, re.MULTILINE)
        if match:
            protein_id = match.group(1)
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO flat_files_mapping (protein_id, file_id)
                    VALUES (?, ?)
                ''', (protein_id, fileId))
            except sqlite3.IntegrityError as e:
                print(f"Error inserting for file_id {fileId}: {e}")
        else:
            print(f"No protein ID found for file_id {fileId}")

    conn.commit()
    conn.close()