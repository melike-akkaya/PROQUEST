import matplotlib.pyplot as plt
import pandas as pd

def visualizeNearestSearchResults():
    values = [460, 19, 10, 5, 4, 1, 1]
    labels = ["First Nearest Result", "Second Nearest Result", "Third Nearest Result",
            "Fourth Nearest Result", "Fifth Nearest Result", "Sixth Nearest Result",
            "Seventh Nearest Result"]
    colors = plt.cm.Paired(range(len(values)))

    plt.figure(figsize=(10, 8))
    patches, texts = plt.pie(values, colors=colors, startangle=140)
    plt.title('Distribution of Results in Nearest Searches')
    plt.legend(patches, labels, loc='best', bbox_to_anchor=(1, 0.5))
    plt.axis('equal')  
    plt.tight_layout()
    plt.show()

def visualizeDuration(byLength):
    if (not byLength):
        data = pd.read_excel('Analysis Results.xlsx', usecols=['Embedding Duration (in seconds)', 'Search Duration (in seconds)'])
    else:
        data = pd.read_excel('Analysis_Results.xlsx', usecols=['Length', 'Embedding Duration (in seconds)', 'Search Duration (in seconds)'])
        data = data.sort_values(by='Length')

    plt.figure(figsize=(10, 5))
    if (byLength):
        plt.plot(data['Length'], data['Embedding Duration (in seconds)'], label='Embedding Duration', color='blue')
        plt.xlabel('Protein Length')
    else:
        plt.plot(data['Embedding Duration (in seconds)'], label='Embedding Duration', color='blue')
        plt.xlabel('Protein ID')

    plt.title('Embedding Duration')
    plt.ylabel('Duration in seconds')
    plt.legend()
    plt.show()

    plt.figure(figsize=(10, 5))
    plt.plot(data['Search Duration (in seconds)'], label='Search Duration', color='green')
    plt.title('Search Duration')
    plt.xlabel('Protein ID Index')
    plt.ylabel('Duration in seconds')
    plt.legend()
    plt.show()
