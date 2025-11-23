#!/usr/bin/env bash
set -e 

source /home/g1-bbm-project/anaconda3/etc/profile.d/conda.sh

ENV_NAME="env"

if ! conda env list | grep -qE "^${ENV_NAME}\s"; then
    echo ">>> Creating conda environment '${ENV_NAME}'..."
    conda create -n "${ENV_NAME}" python=3.10 -y
else
    echo ">>> Conda environment '${ENV_NAME}' already exists, skipping creation."
fi

echo ">>> Activating environment..."
conda activate "${ENV_NAME}"

echo ">>> Installing Python packages (pip)..."
pip install requests \
    langchain_openai \
    langchain_google_genai \
    langchain_anthropic \
    langchain_nvidia_ai_endpoints \
    langchain \
    scikit-learn \
    langchain_mistralai \
    openpyxl \
    matplotlib \
    h5py \
    annoy \
    langchain_community \
    langchain_classic \
    langchain_huggingface \
    transformers \
    spacy \
    sentence-transformers \
    einops \
    chromadb \
    sentencepiece \
    pinecone_text

echo ">>> Installing PyTorch + torchvision..."
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu126

echo ">>> Downloading spaCy model..."
python -m spacy download en_core_web_sm

echo ">>> Setup completed successfully!"
