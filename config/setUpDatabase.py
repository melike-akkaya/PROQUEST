import sqlite3
import json

def initialize_database():
    conn = sqlite3.connect('protein_index.db')
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS search_fields (
        id TEXT PRIMARY KEY,
        label TEXT,
        itemType TEXT,
        term TEXT,
        dataType TEXT,
        fieldType TEXT,
        example TEXT,
        regex TEXT
    )
    ''')

    c.execute('''
    CREATE TABLE IF NOT EXISTS result_fields (
        id TEXT PRIMARY KEY,
        groupName TEXT,
        isDatabaseGroup BOOLEAN,
        label TEXT,
        name TEXT,
        sortField TEXT
    )
    ''')
    conn.commit()
    conn.close()

def load_json_data(file_path, table):
    conn = sqlite3.connect('protein_index.db')
    c = conn.cursor()

    with open(file_path, 'r') as file:
        data = json.load(file)
        for entry in data:
            try:
                if table == 'search_fields':
                    c.execute('''
                    INSERT OR IGNORE INTO search_fields (id, label, itemType, term, dataType, fieldType, example, regex)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        entry['id'], 
                        entry['label'], 
                        entry['itemType'], 
                        entry.get('term', None), 
                        entry.get('dataType', None), 
                        entry.get('fieldType', None), 
                        entry.get('example', None), 
                        entry.get('regex', None)
                    ))
                elif table == 'result_fields':
                    group_name = entry['groupName']
                    is_database_group = entry['isDatabaseGroup']
                    for field in entry['fields']:
                        c.execute('''
                        INSERT OR IGNORE INTO result_fields (id, groupName, isDatabaseGroup, label, name, sortField)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ''', (
                            field['id'], 
                            group_name, 
                            is_database_group, 
                            field['label'], 
                            field['name'], 
                            field.get('sortField', None)
                        ))
            except sqlite3.Error as e:
                print(f"An error occurred: {e}")
    conn.commit()
    conn.close()

initialize_database()

load_json_data('./asset/search-fields.json', 'search_fields')
load_json_data('./asset/result-fields.json', 'result_fields')

'''
def print_first_five_records(table):
     conn = sqlite3.connect('protein_index.db')
     c = conn.cursor()
     c.execute(f'SELECT * FROM {table} LIMIT 5')
     print(f"First 5 records from {table}:")
     for row in c.fetchall():
         print(row)
     conn.close()

print_first_five_records('search_fields')
print_first_five_records('result_fields')
'''