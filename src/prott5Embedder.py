import time
import torch
import numpy as np
from transformers import T5EncoderModel, T5Tokenizer

device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
print("Using device: {}".format(device))

def getT5Model(model_dir, transformer_link="Rostlab/prot_t5_xl_half_uniref50-enc"):
    print("Loading: {}".format(transformer_link))
    if model_dir is not None:
        print("##########################")
        print("Loading cached model from: {}".format(model_dir))
        print("##########################")
    model = T5EncoderModel.from_pretrained(transformer_link, cache_dir=model_dir)
    # only cast to full-precision if no GPU is available
    if device == torch.device("cpu"):
        print("Casting model to full precision for running on CPU ...")
        model.to(torch.float32)

    model = model.to(device)
    model = model.eval()
    vocab = T5Tokenizer.from_pretrained(transformer_link, do_lower_case=False)
    return model, vocab

def getEmbeddings(seq_dict, model_dir, per_protein, max_residues=4000, max_seq_len=1000, max_batch=100):
    model, vocab = getT5Model(model_dir)

    seq_dict = sorted(seq_dict.items(), key=lambda kv: len(seq_dict[kv[0]]), reverse=True)

    batch = list()
    emb_dict = dict()

    for seq_idx, (pdb_id, seq) in enumerate(seq_dict, 1):
        #seq = seq.replace('U', 'X').replace('Z', 'X').replace('O', 'X')
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
                print(f"RuntimeError during embedding for {pdb_id} (L={seq_len}). Error: {e}")
                continue

            for batch_idx, identifier in enumerate(pdb_ids):
                s_len = seq_lens[batch_idx]
                emb = embedding_repr.last_hidden_state[batch_idx, :s_len]

                if per_protein:
                    emb = emb.mean(dim=0)

                if len(emb_dict) == 0:
                    print("Embedded protein {} with length {} to emb. of shape: {}".format(
                        identifier, s_len, emb.shape))

                emb_dict[identifier] = emb.detach().cpu().numpy().squeeze()

    return emb_dict

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