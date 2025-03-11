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

def blastComparison(totalProteins, values):
    categories = ["1. Found Proteins", "2. Found Proteins", "3. Found Proteins", "4. Found Proteins", "5. Found Proteins"]
    

    percentages = [(v / totalProteins) * 100 for v in values]

    plt.figure(figsize=(12, 6))
    plt.bar(categories, values, color=['blue', 'green', 'red', 'purple', 'orange'])

    for i, v in enumerate(values):
        plt.text(i, v + 20, f"{v} ({percentages[i]:.1f}%)", ha='center', fontsize=12)

    plt.title("Number of Found Proteins in Similar Proteins\n(where n = 10000 and Manhattan Distance Algorithm is used)")
    plt.ylim(0, totalProteins+50)
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    plt.show()

def compareTime(blastFile, vectorDbFiles):
    blastInfo = []
    with open(blastFile, 'r') as f:
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) > 1:
                try:
                    blastInfo.append(float(parts[2]))
                except ValueError:
                    continue
                
    avgBlastTime = sum(blastInfo) / len(blastInfo) if blastInfo else 0

    avgSearchTimes = [0] * (len(vectorDbFiles) + 2) 
    avgBlastTimes = [avgBlastTime] + [0] * (len(vectorDbFiles) + 1)  
    avgEmbeddingTimes = [0] * (len(vectorDbFiles) + 2)  
    
    embeddingInfo = []
    if vectorDbFiles:
        with open(vectorDbFiles[0], 'r') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) > 1:
                    try:
                        embeddingInfo.append(float(parts[1]))
                    except ValueError:
                        continue

    avgEmbeddingTime = sum(embeddingInfo) / len(embeddingInfo) if embeddingInfo else 0
    avgEmbeddingTimes[1] = avgEmbeddingTime 

    for i, file in enumerate(vectorDbFiles):
        searchInfo = []
        with open(file, 'r') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) > 2:
                    try:
                        searchInfo.append(float(parts[2]))
                    except ValueError:
                        continue
        
        avgSearchTime = sum(searchInfo) / len(searchInfo) if searchInfo else 0
        avgSearchTimes[i + 2] = avgSearchTime 

    numCategories = len(vectorDbFiles) + 2 

    x = np.arange(numCategories)
    barWidth = 0.25

    plt.figure(figsize=(12, 6))
    plt.bar(x, avgBlastTimes, barWidth, label='Average Blast Time', color='blue')
    plt.bar(x, avgEmbeddingTimes, barWidth, label='Average Embedding Creation Time', color='green')
    plt.bar(x, avgSearchTimes, barWidth, label='Average Search Time', color='orange')

    plt.title('Average Time Analysis')
    plt.xlabel('Categories')
    plt.ylabel('Average Time (in seconds)')
    plt.xticks(x, ['Blast Search', 'Embedding Creation', 'vectordb0\nn=10, euclidean', 'vectordb1\nn=1000, manhattan', 'vectordb2\nn=1000, angular', 'vectordb3\nn=10000, manhattan'] )
    plt.legend()
    plt.tight_layout()
    plt.show()
compareTime('blast.txt', ['vectordb0.txt', 'vectordb1.txt', 'vectordb2.txt', 'vectordb3.txt',])
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