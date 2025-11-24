import pandas as pd
import sqlite3

def removeIEAAnnotations() :
    inputFile = 'asset/goa_uniprot_all.gpa'
    outputFile = 'asset/goa_uniprot_updated.gpa'

    # this information retrived from : 
    # https://raw.githubusercontent.com/evidenceontology/evidenceontology/master/gaf-eco-mapping.txt
    notDesiredEvidenceCodes = {
        'ECO:0000501', 'ECO:0000256', 'ECO:0000501', 'ECO:0007322', 'ECO:0007322', 'ECO:0000501', 'ECO:0000265', 'ECO:0000501', 'ECO:0000501', 'ECO:0000501', 'ECO:0000501', 'ECO:0000249', 'ECO:000036'
    }

    with open(inputFile, 'r') as file, open(outputFile, 'w') as outFile:
        for line in file:
            if line.startswith('!'):
                continue
            parts = line.strip().split('\t')
            if len(parts) > 6 and parts[5] not in notDesiredEvidenceCodes:
                outFile.write(line)

    print(f'Filtered data saved to {outputFile}')

def createProteinGoMappingTable(dbPath = "asset/protein_index2.db"):
    conn = sqlite3.connect(dbPath)
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS protein_go_mapping (
        protein_id TEXT,
        go_id TEXT,
        evidence_code TEXT,
        PRIMARY KEY (protein_id, go_id)
    );
    ''')
    cursor.execute('''CREATE INDEX IF NOT EXISTS protein_id_index ON protein_go_mapping(protein_id)''')
    cursor.execute('''CREATE INDEX IF NOT EXISTS go_id_index ON protein_go_mapping(go_id)''')
    conn.commit()
    conn.close()

def processGoaFile(dbPath = "asset/protein_index2.db", goaFilePath = "goa_uniprot_updated.gpa" ):
    conn = sqlite3.connect(dbPath)
    cursor = conn.cursor()

    cursor.execute('SELECT protein_id FROM id_map')
    validProteins = set(row[0] for row in cursor.fetchall())

    with open(goaFilePath, 'r') as file:
        for line in file:
            if line.startswith("!"): 
                continue
            
            columns = line.strip().split("\t")
            proteinId = columns[1] 
            goId = columns[3]      
            evidenceCode = columns[5]

            if proteinId not in validProteins:
                continue

            cursor.execute('''
            INSERT OR IGNORE INTO protein_go_mapping (protein_id, go_id, evidence_code)
            VALUES (?, ?, ?)
            ''', (proteinId, goId, evidenceCode))
            
    conn.commit()
    conn.close()

# to remove electronic GO annotations:
removeIEAAnnotations()

# to create protein_go_mapping table:
createProteinGoMappingTable()

# to fill protein_go_mapping table:
processGoaFile()