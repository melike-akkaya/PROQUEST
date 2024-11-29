# This script generates different bar graphs for each model to show in which try did the model find the result

import pandas as pd
import matplotlib.pyplot as plt

file_path = 'results.xlsx' 
sheets = pd.read_excel(file_path, sheet_name=None)  

num_sheets = len(sheets)
fig, axes = plt.subplots(1, num_sheets, figsize=(5 * num_sheets, 6)) 

if num_sheets == 1:
    axes = [axes]

for ax, (sheet_name, data) in zip(axes, sheets.items()):
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

plt.tight_layout()
plt.show()
