import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def visualizeNearestSearchResults():
    values = [177, 25, 17, 8, 10, 263]
    labels = ["First Nearest Result", "Second Nearest Result", "Third Nearest Result",
            "Fourth Nearest Result", "Fifth Nearest Result", "Cannot Find in First Five Result"]
    colors = plt.cm.Paired(range(len(values)))

    plt.figure(figsize=(10, 8))
    patches, texts = plt.pie(values, colors=colors, startangle=140)
    plt.title('Distribution of Results in Nearest Searches')
    plt.legend(patches, labels, loc='best', bbox_to_anchor=(1, 0.5))
    plt.axis('equal')  
    plt.tight_layout()
    plt.show()

def visualizeDuration():
    data = pd.read_excel('Analysis Results.xlsx', usecols=['Length', 'Embedding Duration (in seconds)', 'Search Duration (in seconds)'])
    data = data.sort_values(by='Length')

    plt.figure(figsize=(10, 5))
    plt.plot(data['Length'], data['Embedding Duration (in seconds)'], label='Embedding Duration', color='blue')
    plt.xlabel('Protein Length')

    plt.title('Embedding Duration')
    plt.ylabel('Duration in seconds')
    plt.legend()
    plt.show()

    plt.figure(figsize=(10, 5))
    
    plt.plot(data['Length'], data['Search Duration (in seconds)'], label='Embedding Duration', color='blue')
    plt.xlabel('Protein Length')
        
    plt.title('Search Duration in Vector DB \n(where n = 10 and Euclidean Distance Algorithm is used)')
    plt.ylabel('Duration in seconds')
    plt.ylim(0, 5) 
    plt.legend()
    plt.show()

def visualizeDurationForBlastSearch():
    data = pd.read_csv('blast.txt', delimiter='\t', usecols=['Length', 'Search Duration (in seconds)'])
    
    data = data.sort_values(by='Length')
    
    plt.figure(figsize=(10, 5))
    plt.plot(data['Length'], data['Search Duration (in seconds)'], label='Search Duration', color='blue')
    plt.xlabel('Protein Length')
    plt.ylabel('Duration in seconds')
    plt.title('Search Duration by Protein Length for Blast Search')
    plt.legend()
    plt.grid(True)
    plt.show()

def visualizeGpuUsage(file_path):
    usage = []

    with open(file_path, 'r') as file:
        for line in file:
            parts = line.split(' - ')
            if len(parts) == 2:
                memory_usage = float(parts[1].split(' ')[-2])
                usage.append(memory_usage)
    

    plt.figure(figsize=(10, 6))
    plt.plot(usage, marker='o', linestyle='-', color='b', label='GPU Memory Usage')
    plt.ylabel('GPU Memory Usage (GB)')
    plt.title('GPU Memory Usage Over Time')
    plt.ylim(0, 25)
    plt.xlabel('Index')
    plt.grid(True)
    plt.legend()
    plt.tight_layout()

    plt.show()

def visualizeComparison(averageBlastTime, averageSearchTime, averageEmbTime):
    categories = ['Average Blast Search Time', 'Average Embedding Creation Time', 'Average Search Time']
    values = [averageBlastTime, averageSearchTime, averageEmbTime]

    plt.figure(figsize=(8, 6))
    bars = plt.bar(categories, values, color=['#2b6dad', '#51c4d3', '#2b9fad'])

    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, height + 0.05, f'{height:.3f}', ha='center', va='bottom')

    plt.ylim(0, max(values) + 0.5)
    plt.ylabel('Time (seconds)')
    plt.title('Average Processing Times Comparison')

    plt.tight_layout()
    plt.savefig('average_times_comparison.png', dpi=300)