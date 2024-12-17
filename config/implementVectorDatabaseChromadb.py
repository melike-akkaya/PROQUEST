import h5py
import chromadb
import numpy as np
import time

filePath = 'asset/per-protein.h5'

dbClient = chromadb.HttpClient(host='44.203.70.25', port=8000)
db = dbClient.create_collection(name="protein_embeddings")

def is_valid_embedding(embedding):
    if np.any(np.isnan(embedding)) or np.any(np.isinf(embedding)):
        return False
    return True

def exponential_backoff(attempt):
    return 2 ** attempt

def batch_add(embeddings, ids, batch_size=5461):
    retries = 3
    for start in range(0, len(embeddings), batch_size):
        end = start + batch_size
        for attempt in range(retries):
            try:
                db.add(embeddings=embeddings[start:end], ids=ids[start:end])
                break 
            except Exception as e:
                if attempt < retries - 1:
                    sleep_time = exponential_backoff(attempt)
                    print(f"Retry #{attempt + 1} in {sleep_time} seconds.")
                    time.sleep(sleep_time)
                else:
                    print(f"Failed after {retries} attempts during batch {start}-{end}.")
                    raise e

def delete_collection(collection_name):
    try:
        response = dbClient.delete_collection(name=collection_name)
        print(f"Collection '{collection_name}' deleted successfully.")
        return response
    except Exception as e:
        print(f"Failed to delete collection: {e}")

# comment out if needed:       
# delete_collection("protein_embeddings")


embeddings = []
ids = []

with h5py.File(filePath, "r") as h5_file:
    for key in h5_file.keys():
        embedding = np.array(h5_file[key])
        
        if is_valid_embedding(embedding):
            embeddings.append(embedding)
            ids.append(key)
        else:
            print(f"Invalid embedding for protein ID {key}, skipped.")

batch_add(embeddings, ids)