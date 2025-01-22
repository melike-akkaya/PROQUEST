import h5py
import numpy as np
import matplotlib.pyplot as plt

filePath = 'asset/per-protein.h5'

with h5py.File(filePath, "r") as h5_file:
    example_key = list(h5_file.keys())[0]
    print(f"\nVisualizing data for key: {example_key}")

    embedding = np.array(h5_file[example_key])

    print(f"Embedding shape: {embedding.shape}")
    print(f"First 10 values of the embedding:\n{embedding[:10]}")

    plt.figure(figsize=(10, 5))
    plt.plot(embedding, marker='o', linestyle='-', markersize=3)
    plt.title(f"Visualization of Embedding for {example_key}")
    plt.xlabel("Feature Index")
    plt.ylabel("Feature Value")
    plt.grid()
    plt.show()
