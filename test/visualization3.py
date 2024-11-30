import pandas as pd
import matplotlib.pyplot as plt
import math

file_path = 'results.xlsx'
sheets = pd.read_excel(file_path, sheet_name=None)

num_sheets = len(sheets)
num_rows = 2  
num_cols = math.ceil(num_sheets / 2) 

fig, axes = plt.subplots(num_rows, num_cols, figsize=(5 * num_cols, 6 * num_rows))

axes = axes.flatten()

for i, (sheet_name, data) in enumerate(sheets.items()):
    ax = axes[i]
    filtered_data = data[data['First Return Value'].notna()]
    
    if 'xth Try' in filtered_data.columns:
        counts = filtered_data['xth Try'].value_counts().reindex(range(1, 11), fill_value=0)
        
        counts.plot(kind='bar', color='skyblue', ax=ax)
        ax.set_title(f'{sheet_name}')
        ax.set_xlabel('xth Try')
        ax.set_ylabel('Frequency')
        ax.set_xticklabels(range(1, 11), rotation=0)
        ax.grid(True, linestyle='--', alpha=0.6)
    else:
        ax.text(0.5, 0.5, "No 'xth Try' column found", transform=ax.transAxes, ha='center', va='center')

for j in range(i + 1, len(axes)):
    fig.delaxes(axes[j])

plt.tight_layout()
plt.show()
