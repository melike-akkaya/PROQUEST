# This script generates different bar graphs for each query type and model

import matplotlib.pyplot as plt

models = ["gemini-pro", "gemini-1.5-flash", "meta-llama-3.1-405b-instruct", "mistrall-small"]
query_types = ["simple queries", "complex queries", "curator-written queries"]

results = {
    "gemini-pro": {
        "simple": [3, 2, 46],
        "complex": [9, 3, 38],
        "curator-written": [6, 0, 13]
    },
    "gemini-1.5-flash": {
        "simple": [12, 0, 39],
        "complex": [13, 0, 37],
        "curator-written": [4, 0, 15]
    },
    "meta-llama-3.1-405b-instruct": {
        "simple": [9, 0, 42],
        "complex": [7, 0, 43],
        "curator-written": [6, 0, 13]
    },
    "mistrall-small": {
        "simple": [3, 25, 23],
        "complex": [2, 34, 14],
        "curator-written": [0, 17, 2]
    }
}

fig, axs = plt.subplots(nrows=3, ncols=4, figsize=(15, 10), sharex='col', sharey='row',
                        gridspec_kw={'hspace': 0.5, 'wspace': 0.3})

categories = ['NULL', 'ERROR', 'Correct Result']
colors = ['orange', 'red', 'blue']

for i, query_type in enumerate(query_types):
    for j, model in enumerate(models):
        data = results[model][query_type.split()[0].lower()]  

        axs[i, j].bar(categories, data, color=colors, edgecolor='black')
        axs[i, j].grid(True, which='both', linestyle='--', linewidth=0.5, color='grey', axis='both')
        for spine in ['top', 'right', 'bottom', 'left']:
            axs[i, j].spines[spine].set_linewidth(1)
            axs[i, j].spines[spine].set_color('black')

        if j != 0:
            axs[i, j].tick_params(labelleft=False)
        if i != 2:
            axs[i, j].tick_params(labelbottom=False)

        axs[i, j].set_ylim(0, 50)

        if i == 0:
            axs[i, j].set_title(model, fontsize=9, fontweight='bold', pad=10)

        if j == 0:
            axs[i, j].set_ylabel(query_type, fontsize=9, fontweight='bold', labelpad=10)

plt.subplots_adjust(left=0.07, right=0.97, top=0.92, bottom=0.08)

fig.suptitle('Model Performance Analysis', fontsize=14, fontweight='bold')

plt.show()
