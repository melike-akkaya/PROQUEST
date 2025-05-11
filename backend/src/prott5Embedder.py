import os
import torch
import numpy as np
from transformers import T5EncoderModel, T5Tokenizer

device = torch.device('cuda:2' if torch.cuda.is_available() else 'cpu')
print(f"[protT5Embedder] Using device: {device}")

# where to cache HF weights
MODEL_NAME = "Rostlab/prot_t5_xl_half_uniref50-enc"
MODEL_DIR  = "modeldir"

# module‐level cache
_model: T5EncoderModel | None    = None
_tokenizer: T5Tokenizer | None   = None

def load_t5(
    transformer_link: str = MODEL_NAME,
    model_dir: str         = MODEL_DIR
) -> tuple[T5EncoderModel, T5Tokenizer]:
    """
    Loads (or reuses) a single T5EncoderModel + T5Tokenizer into module globals
    """
    global _model, _tokenizer
    if _model is None or _tokenizer is None:
        os.makedirs(model_dir, exist_ok=True)
        print(f"[protT5Embedder] Loading {transformer_link} into {_model=}, {_tokenizer=}")
        _model = T5EncoderModel.from_pretrained(transformer_link, cache_dir=model_dir)
        _tokenizer = T5Tokenizer.from_pretrained(
            transformer_link, 
            do_lower_case=False, 
            legacy=False, 
            cache_dir=model_dir
        )
        if device.type == "cpu":
            _model.to(torch.float32)
        _model.to(device).eval()
        print("[protT5Embedder] Model & tokenizer ready.")
    return _model, _tokenizer

def getEmbeddings(seq_dict, per_protein, visualize, max_residues=4000, max_seq_len=1000, max_batch=100) -> tuple[dict, dict]:
    """
    seq_dict: { identifier: 'MST...' }
    """
    # ensure load_t5() has been run
    model, tokenizer = load_t5()

    # sort longest first
    sorted_seqs = sorted(seq_dict.items(), key=lambda kv: len(kv[1]), reverse=True)

    embDict = {}
    sizeDict = {}
    batch = []

    for i, (pid, seq) in enumerate(sorted_seqs, start=1):
        cleaned = seq.replace('U','X').replace('Z','X').replace('O','X')
        L = len(cleaned)
        spaced = ' '.join(cleaned)
        batch.append((pid, spaced, L))
        # count residues in current batch and add the last sequence length to
        # avoid that batches with (n_res_batch > max_residues) get processed 
        n_res = sum(l for _,_,l in batch) + L
        if len(batch) >= max_batch or n_res >= max_residues or i == len(sorted_seqs) or L > max_seq_len:
            ids, seqs, lens = zip(*batch)
            batch = []

            toks = tokenizer.batch_encode_plus(seqs, add_special_tokens=True, padding="longest")
            input_ids = torch.tensor(toks['input_ids']).to(device)
            attention_mask = torch.tensor(toks['attention_mask']).to(device)

            with torch.no_grad():
                out = model(input_ids, attention_mask=attention_mask)

            for idx, prot_id in enumerate(ids):
                length = lens[idx]
                emb = out.last_hidden_state[idx, :length]
                if per_protein:
                    emb = emb.mean(dim=0)
                sizeDict[prot_id] = [length, tuple(emb.shape)]
                embDict[prot_id]  = emb.cpu().numpy().squeeze()

                if visualize and len(embDict)==1:
                    print(f"[protT5Embedder] Embedded {prot_id}: shape {emb.shape}")

    return embDict, sizeDict
