import pandas as pd
import subprocess
import time
from Bio import SeqIO

def extract_protein_id(header):
    """Extracts the protein ID from a FASTA header."""
    if '|' in header:
        parts = header.split('|')
        if len(parts) > 1:
            return parts[1]  # Extracts the correct protein ID
    return header.split()[0][1:]  # Fallback if format is different

def read_selected_sequences(fasta_path):
    """Reads the already selected 1,000 protein sequences from the FASTA file."""
    print(f"Reading sequences from {fasta_path}...")
    sequences = list(SeqIO.parse(fasta_path, "fasta"))
    print(f"Total sequences loaded: {len(sequences)}")
    return sequences

def run_blast(sequence, blast_db="uniprot_sprot", max_hits=5):
    """Runs BLAST for a given protein sequence and retrieves the top matches."""
    query_file = "query.fasta"
    output_file = "blast_results.txt"
    
    protein_id = extract_protein_id(sequence.description)
    with open(query_file, "w") as f:
        f.write(f">{protein_id}\n{sequence.seq}\n")
    
    print(f"Running BLAST for Protein ID: {protein_id}...")
    
    start_time = time.time()
    blast_cmd = [
        "blastp", "-query", query_file, "-db", blast_db,
        "-out", output_file, "-outfmt", "6 qseqid sseqid evalue",
        "-max_target_seqs", str(max_hits),
        "-evalue", "10"
    ]
    result = subprocess.run(blast_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    end_time = time.time()
    
    if result.returncode != 0:
        print(f"BLAST failed for {protein_id}: {result.stderr.decode()}")
        return [], end_time - start_time
    
    results = []
    with open(output_file, "r") as f:
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) == 3:
                results.append((extract_protein_id(parts[1]), float(parts[2])))
    
    search_time = end_time - start_time
    print(f"BLAST completed for {protein_id} in {search_time:.2f} seconds. Found {len(results)} matches.")
    return results, search_time

def process_sequences(fasta_path, output_excel):
    selected_sequences = read_selected_sequences(fasta_path)
    results_df = pd.DataFrame()
    
    for i, sequence in enumerate(selected_sequences, 1):
        print(f"Processing sequence {i}/{len(selected_sequences)}...")
        protein_id = extract_protein_id(sequence.description)
        seq_length = len(sequence.seq)
        
        similar_proteins, search_time = run_blast(sequence)
        
        result_data = {
            "Protein ID": protein_id,
            "Length": seq_length,
            "Search Duration (in seconds)": search_time,
        }
        
        for i, (sim_protein, e_value) in enumerate(similar_proteins[:5]):
            result_data[f"Similar Protein {i+1}"] = sim_protein
            result_data[f"E-Value {i+1}"] = f"{e_value:.2e}"
        
        newRow = pd.DataFrame([result_data])
        results_df = pd.concat([results_df, newRow], ignore_index=True)
    
    print(f"Saving results to {output_excel}...")
    results_df.to_excel(output_excel, index=False)
    print("BLAST search completed! Results saved successfully.")

def main():
    fasta_path = "selected_proteins.fasta"
    output_excel = "blast_search_results_5.xlsx"
    process_sequences(fasta_path, output_excel)

if __name__ == "__main__":
    main()
