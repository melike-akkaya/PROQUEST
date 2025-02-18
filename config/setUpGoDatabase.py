import sqlite3
import pandas as pd

protein_index_db_path = "protein_index.db"  # Update with actual path
annotations_db_path = "annotations.db"  # Update with actual path

protein_index_conn = sqlite3.connect(protein_index_db_path)
annotations_conn = sqlite3.connect(annotations_db_path)

protein_index_conn.execute(f"ATTACH DATABASE '{annotations_db_path}' AS annotations_db;")

query = """
SELECT id_map.protein_id, GROUP_CONCAT(annotations_db.annotations.GO_ID, ', ') AS gp_term
FROM id_map
LEFT JOIN annotations_db.annotations ON id_map.protein_id = annotations_db.annotations.DB_Object_ID
GROUP BY id_map.protein_id;
"""

matched_data = pd.read_sql(query, protein_index_conn)

id_map_df = pd.read_sql("SELECT * FROM id_map;", protein_index_conn)

id_map_df = id_map_df.merge(matched_data, on="protein_id", how="left")

id_map_df.to_sql("id_map", protein_index_conn, if_exists="replace", index=False)

protein_index_conn.commit()
protein_index_conn.close()
annotations_conn.close()

print("GO terms successfully added to id_map in protein_index.db!")
