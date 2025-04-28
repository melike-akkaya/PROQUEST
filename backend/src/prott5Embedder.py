import time
import torch
import numpy as np
from transformers import T5EncoderModel, T5Tokenizer
import os
import streamlit as st 
from functools import lru_cache

device = torch.device('cuda:3' if torch.cuda.is_available() else 'cpu')
print("Using device: {}".format(device))

@lru_cache(maxsize=1)
def _load_t5(transformer_link="Rostlab/prot_t5_xl_half_uniref50-enc",
            model_dir="modeldir"):
    os.makedirs(model_dir, exist_ok=True)
    model = T5EncoderModel.from_pretrained(transformer_link, cache_dir=model_dir)
    tokenizer = T5Tokenizer.from_pretrained(transformer_link,
                                            do_lower_case=False,
                                            legacy=False,
                                            cache_dir=model_dir)
    if device.type == "cpu":
        model.to(torch.float32)
    model.to(device).eval()
    return model, tokenizer

def getT5Model(visualize, transformer_link="Rostlab/prot_t5_xl_half_uniref50-enc"):
    if visualize:
        st.write("Loading model: {}".format(transformer_link))

    model_dir = "modeldir" # set default model directory 

    if os.path.exists(model_dir) and os.listdir(model_dir):
        if visualize:
            st.write("Loading cached model from: {}".format(model_dir))
    else:
        if visualize:
            st.write("Model not found in {}. Downloading and caching model...".format(model_dir))
        os.makedirs(model_dir, exist_ok=True)
    
    # loading the model from the cached directory or downloading it if not present
    model = T5EncoderModel.from_pretrained(transformer_link, cache_dir=model_dir)
    vocab = T5Tokenizer.from_pretrained(transformer_link, do_lower_case=False, legacy=False, cache_dir=model_dir)

    if device == torch.device("cpu"):
        if visualize:
            st.write("Casting model to full precision for running on CPU ...")
        model.to(torch.float32)
    model = model.to(device)
    model = model.eval()
    return model, vocab

def getEmbeddings(seq_dict, per_protein, visualize, max_residues=4000, max_seq_len=1000, max_batch=100):
    model, vocab = _load_t5()

    seq_dict = sorted(seq_dict.items(), key=lambda kv: len(seq_dict[kv[0]]), reverse=True)

    batch = list()
    embDict = dict()
    sizeDict = dict()

    for seq_idx, (pdb_id, seq) in enumerate(seq_dict, 1):
        seq = seq.replace('U', 'X').replace('Z', 'X').replace('O', 'X')
        seq_len = len(seq)
        seq = ' '.join(list(seq))
        batch.append((pdb_id, seq, seq_len))
        # count residues in current batch and add the last sequence length to
        # avoid that batches with (n_res_batch > max_residues) get processed 
        n_res_batch = sum([s_len for _, _, s_len in batch]) + seq_len 
        if len(batch) >= max_batch or n_res_batch >= max_residues or seq_idx == len(seq_dict) or seq_len > max_seq_len:
            pdb_ids, seqs, seq_lens = zip(*batch)
            batch = list()

            token_encoding = vocab.batch_encode_plus(seqs, add_special_tokens=True, padding="longest")
            input_ids = torch.tensor(token_encoding['input_ids']).to(device)
            attention_mask = torch.tensor(token_encoding['attention_mask']).to(device)

            try:
                with torch.no_grad():
                    embedding_repr = model(input_ids, attention_mask=attention_mask)
            except RuntimeError as e:
                if visualize:
                    st.write(f"RuntimeError during embedding for {pdb_id} (L={seq_len}). Error: {e}")
                else:
                    print(f"RuntimeError during embedding for {pdb_id} (L={seq_len}). Error: {e}")
                continue

            for batch_idx, identifier in enumerate(pdb_ids):
                s_len = seq_lens[batch_idx]
                emb = embedding_repr.last_hidden_state[batch_idx, :s_len]

                if per_protein:
                    emb = emb.mean(dim=0)
                if len(embDict) == 0:
                    if visualize:
                        st.write("Embedded protein {} with length {} to emb. of shape: {}".format(identifier, s_len, emb.shape))
                    else:
                        print("Embedded protein {} with length {} to emb. of shape: {}".format(
                        identifier, s_len, emb.shape))

                sizeDict[identifier] = [s_len, emb.shape]
                embDict[identifier] = emb.detach().cpu().numpy().squeeze()

    return embDict, sizeDict

# def create_arg_parser():
#     """"Creates and returns the ArgumentParser object."""
#     parser = argparse.ArgumentParser(description=(
#         't5_embedder.py creates T5 embeddings for a given text ' +
#         ' file containing sequence(s) in FASTA-format.'))
#     parser.add_argument('-i', '--input', required=True, type=str,
#                         help='A path to a fasta-formatted text file containing protein sequence(s).')
#     parser.add_argument('-o', '--output', required=True, type=str,
#                         help='A path for saving the created embeddings as NumPy npz file.')
#     parser.add_argument('--model', required=False, type=str,
#                         default=None,
#                         help='A path to a directory holding the checkpoint for a pre-trained model')
#     return parser