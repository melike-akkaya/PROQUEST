import os
import torch
import numpy as np
from transformers import T5EncoderModel, T5Tokenizer
import math

device = torch.device('cuda:5' if torch.cuda.is_available() else 'cpu')
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

def getEmbeddings(
    seq_dict,
    per_protein: bool,
    visualize: bool,
    max_residues: int = 4000,
    max_seq_len: int = 1000,
    max_batch: int = 100
) -> tuple[dict, dict]:
    """
    seq_dict: { identifier: 'MST...' }
    Returns:
      embDict: { id: numpy array (CPU) }
      sizeDict: { id: [full_seq_len, emb_shape] }
    """
    model, tokenizer = load_t5()
    model.eval()

    device = next(model.parameters()).device if any(True for _ in model.parameters()) else (
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    # --- helpers --------------------------------------------------------------
    def _clean(seq: str) -> str:
        return seq.replace("U","X").replace("Z","X").replace("O","X")

    def _chunks(seq: str, chunk_len: int):
        """yield (start, end, piece_str) with at most chunk_len residues."""
        L = len(seq)
        if L <= chunk_len:
            yield 0, L, seq
            return
        for s in range(0, L, chunk_len):
            e = min(L, s + chunk_len)
            yield s, e, seq[s:e]

    def _flush_batch(batch_items):
        """
        batch_items: list of dicts:
          {pid, spaced, clen}  (spaced = 'A B C', clen = residues in this chunk)
        """
        if not batch_items:
            return None

        toks = tokenizer.batch_encode_plus(
            [it["spaced"] for it in batch_items],
            add_special_tokens=True,
            padding="longest"
        )
        input_ids = torch.tensor(toks["input_ids"], dtype=torch.long, device=device)
        attention_mask = torch.tensor(toks["attention_mask"], dtype=torch.long, device=device)

        try:
            with torch.inference_mode():
                out = model(input_ids=input_ids, attention_mask=attention_mask)
            hidden = out.last_hidden_state  # (B, T, H)

            outputs = []
            for idx, it in enumerate(batch_items):
                # real length
                emb = hidden[idx, : it["clen"]]   # (clen, H)
                if per_protein:
                    emb = emb.mean(dim=0)         # (H,)
                emb_cpu = emb.detach().to("cpu").numpy()
                outputs.append((it["pid"], emb_cpu, emb.shape))
            return outputs

        finally:
            # clean gpu
            del toks, input_ids, attention_mask
            try:
                del out, hidden
            except Exception:
                pass
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.ipc_collect()

    # chunk length sequences - job list
    items = []   # 1 element = 1 chunk
    full_lengths = {}  # pid -> full length
    for pid, seq in seq_dict.items():
        c = _clean(seq)
        full_lengths[pid] = len(c)
        for _, _, piece in _chunks(c, max_seq_len):
            items.append({
                "pid": pid,
                "clen": len(piece),
                "spaced": " ".join(piece)
            })

    # priortize chunks to reduce padding
    items.sort(key=lambda it: it["clen"], reverse=True)

    # main loop: build micro-batches according to the token budget
    embDict = {}
    sizeDict = {}
    # if per_protein is true, aggregate chunk averages at the protein level
    agg = {}   # pid -> sum vector
    cnt = {}   # pid -> #chunks

    token_budget = max_residues
    start_idx = 0
    while start_idx < len(items):
        batch = []
        token_sum = 0
        while start_idx < len(items) and len(batch) < max_batch:
            cand = items[start_idx]
            if token_sum + cand["clen"] > token_budget and batch:
                break
            batch.append(cand)
            token_sum += cand["clen"]
            start_idx += 1

        # automatically decrease if oom
        while True:
            try:
                out = _flush_batch(batch)
                break
            except torch.cuda.OutOfMemoryError:
                # reduce the budget → try a smaller batch
                if token_budget <= 256 and len(batch) == 1 and batch[0]["clen"] <= max_seq_len:
                    # no room to reduce further: as a last resort, shrink the chunk size
                    # split this single chunk into two and put them back into the queue
                    one = batch[0]
                    piece = one["spaced"].replace(" ", "")
                    half = max(256, one["clen"] // 2)
                    first = {"pid": one["pid"], "clen": half, "spaced": " ".join(piece[:half])}
                    second = {"pid": one["pid"], "clen": one["clen"] - half, "spaced": " ".join(piece[half:])}

                    items[start_idx:start_idx] = [second]
                    items[start_idx:start_idx] = [first]

                    out = None
                    batch = []
                    break

                token_budget = max(256, token_budget // 2)

                token_sum = 0
                new_batch = []
                for it in batch:
                    if token_sum + it["clen"] > token_budget and new_batch:
                        break
                    new_batch.append(it)
                    token_sum += it["clen"]

                batch = new_batch

                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    torch.cuda.ipc_collect()

        if not out:
            # In case of OOM, the batch was split and requeued; continue
            continue

        for pid, emb_cpu, emb_shape in out:
            if per_protein:
                if pid in agg:
                    agg[pid] += emb_cpu
                    cnt[pid] += 1
                else:
                    agg[pid] = emb_cpu
                    cnt[pid] = 1
                sizeDict[pid] = [full_lengths[pid], emb_cpu.shape]  # record the full length and the single-chunk shape (H,)
            else:
                if pid in embDict:
                    embDict[pid] = np.concatenate([embDict[pid], emb_cpu], axis=0)
                else:
                    embDict[pid] = emb_cpu
                sizeDict[pid] = [full_lengths[pid], emb_cpu.shape]

    # for per-token embeddings: concatenate the chunks in sequence
    if per_protein:
        for pid, v in agg.items():
            emb = v / float(cnt[pid])
            embDict[pid] = emb
            sizeDict[pid] = [full_lengths[pid], emb.shape]

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()

    return embDict, sizeDict
