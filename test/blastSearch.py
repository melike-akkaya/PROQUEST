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

def run_blast(sequence, blast_db="uniprot_sprot", max_hits=250):
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

def process_sequences(fasta_path, output_txt):
    selected_sequences = read_selected_sequences(fasta_path)
    
    # Open the text file in write mode
    with open(output_txt, "w") as out_file:
        # Write the header (similar to Excel columns)
        out_file.write("Protein ID\tLength\tSearch Duration (in seconds)")
        
        # Write columns for similar proteins and E-values
        for i in range(1, 251):  # 250 proteins
            out_file.write(f"\tSimilar Protein {i}\tE-value {i}")
        out_file.write("\n")
        
        for i, sequence in enumerate(selected_sequences, 1):
            print(f"Processing sequence {i}/{len(selected_sequences)}...")
            protein_id = extract_protein_id(sequence.description)
            seq_length = len(sequence.seq)
            
            similar_proteins, search_time = run_blast(sequence, blast_db="uniprot_sprot", max_hits=250)  # Using BLAST DB
            
            # Write the sequence information into the file
            out_file.write(f"{protein_id}\t{seq_length}\t{search_time:.2f}")
            for sim_protein, e_value in similar_proteins[:250]:  # Collect top 250 similar proteins
                # Write each protein's data into the text file in a tab-separated format
                out_file.write(f"\t{sim_protein}\t{e_value:.2e}")
            out_file.write("\n")
    
    print(f"BLAST search completed! Results saved to {output_txt}.")

def main():
    fasta_path = "selected_proteins.fasta"
    output_txt = "blast_search_results_250.txt"  # Adjusted output filename for clarity
    process_sequences(fasta_path, output_txt)

if __name__ == "__main__":
    main()
