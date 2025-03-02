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

    avgEmbeddingTimes = []
    avgSearchTimes = []
    avgBlastTimes = [avgBlastTime] 
    
    for file in vectorDbFiles:
        secondInfo = []
        thirdInfo = []
        
        with open(file, 'r') as f:
            for line in f:
                parts = line.strip().split(',')
                if len(parts) > 2:
                    try:
                        secondInfo.append(float(parts[1]))
                        thirdInfo.append(float(parts[2])) 
                    except ValueError:
                        continue  
        
        avgEmbeddingTime = sum(secondInfo) / len(secondInfo) if secondInfo else 0
        avgSearchTime = sum(thirdInfo) / len(thirdInfo) if thirdInfo else 0
        
        avgEmbeddingTimes.append(avgEmbeddingTime)
        avgSearchTimes.append(avgSearchTime)

    avgBlastTimes = [avgBlastTime] + [0] * len(vectorDbFiles)  # 0 for vector dbs
    avgSearchTimes = [0] + avgSearchTimes  # 0 for blast
    avgEmbeddingTimes = [0] + avgEmbeddingTimes  # 0 for blast

    numCategories = len(vectorDbFiles) + 1  # +1 for blast

    x = np.arange(numCategories)

    barWidth = 0.25

    plt.figure(figsize=(10, 6))
    plt.bar(x, avgBlastTimes, barWidth, label='Average Blast Time', color='blue')
    plt.bar(x - barWidth / 2, avgSearchTimes, barWidth, label='Average Search Time', color='orange')
    plt.bar(x + barWidth / 2, avgEmbeddingTimes, barWidth, label='Average Embedding Time', color='green')

    plt.title('Average Time Analysis')
    plt.xlabel('Files')
    plt.ylabel('Average Time (in seconds)')
    plt.xticks(x, ['blast'] + ['vectordb0\nn=10, euclidean'] + ['vectordb1\nn=1000, manhattan'] + ['vectordb2\nn=1000, angular'] + ['vectordb3\nn=10000, manhattan'] )
    plt.tight_layout()
    plt.show()

compareTime('blast.txt', ['vectordb0.txt', 'vectordb1.txt', 'vectordb2.txt', 'vectordb3.txt'])
