import matplotlib.pyplot as plt
import pandas as pd

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
        
    plt.title('Search Duration')
    plt.ylabel('Duration in seconds')
    plt.legend()
    plt.show()

def blastComparison(totalProteins, values):
    categories = ["1. Found Proteins", "2. Found Proteins", "3. Found Proteins", "4. Found Proteins", "5. Found Proteins"]
    

    percentages = [(v / totalProteins) * 100 for v in values]

    plt.figure(figsize=(12, 6))
    plt.bar(categories, values, color=['blue', 'green', 'red', 'purple', 'orange'])

    for i, v in enumerate(values):
        plt.text(i, v + 20, f"{v} ({percentages[i]:.1f}%)", ha='center', fontsize=12)

    plt.title("Number of Found Proteins in Similar Proteins")
    plt.ylim(0, totalProteins+50)
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    plt.show()