import matplotlib.pyplot as plt
import numpy as np

models = ['gemini-pro', 'gemini-1.5-flash', 'meta-llama-3.1-405b-instruct', 'mistral-small']
correct = [97, 91, 98, 39]
null = [18, 29, 22, 5]
error = [5, 0, 0, 76]

x = np.arange(len(models))
width = 0.25

fig, ax = plt.subplots(figsize=(12, 8))
bars1 = ax.bar(x - width, correct, width, label='Correct', color='blue')
bars2 = ax.bar(x, null, width, label='Solr query generated but wrong', color='orange')
bars3 = ax.bar(x + width, error, width, label='Solr query could not generated', color='red')

ax.set_xlabel('Models', fontsize=14, labelpad=10)
ax.set_ylabel('Number of Queries', fontsize=14, labelpad=10)
ax.set_title(
    'Query Results by Model',
    fontsize=16,
    pad=20
)
ax.set_xticks(x)
ax.set_xticklabels(models, fontsize=12)
ax.legend(fontsize=12)

for bars in [bars1, bars2, bars3]:
    for bar in bars:
        yval = bar.get_height()
        if yval > 0: 
            ax.text(
                bar.get_x() + bar.get_width() / 2, 
                yval + 1, 
                f'{int(yval)}', 
                ha='center', 
                va='bottom', 
                fontsize=10
            )

plt.tight_layout()

plt.show()
