import pandas as pd
import matplotlib.pyplot as plt

file_path = "/home/g1-bbm-project/melike2/PROQUEST/test/combined.xlsx"

df = pd.read_excel(file_path)

found_cols = [
    "1. Found Protein",
    "2. Found Protein",
    "3. Found Protein",
    "4. Found Protein",
    "5. Found Protein"
]

similar_cols = [
    "Similar Protein 1",
    "Similar Protein 2",
    "Similar Protein 3",
    "Similar Protein 4",
    "Similar Protein 5"
]

counts = []

for found_col in found_cols:
    count = df.apply(
        lambda row: row[found_col] in row[similar_cols].values,
        axis=1
    ).sum()
    counts.append(count)

total = len(df)
percentages = [(count / total) * 100 for count in counts]

labels = [
    "Top-1 Recovery",
    "Top-2 Recovery",
    "Top-3 Recovery",
    "Top-4 Recovery",
    "Top-5 Recovery"
]

colors = ["blue", "green", "red", "purple", "orange"]

plt.figure(figsize=(12, 6))

bars = plt.bar(labels, counts, color=colors)

plt.title(
    "Number of Found Proteins in Similar Proteins\n"
    f"(where n = 1000 and Angular Distance Algorithm is used)",
    fontsize=14
)

plt.ylabel("Number of Queries")
plt.ylim(0, max(counts) + 80)
plt.grid(axis="y", linestyle="--", alpha=0.7)

for bar, count, percentage in zip(bars, counts, percentages):
    plt.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + 15,
        f"{count} ({percentage:.1f}%)",
        ha="center",
        fontsize=12
    )

plt.tight_layout()
plt.savefig("found_proteins_plot.png", dpi=300)
plt.show()