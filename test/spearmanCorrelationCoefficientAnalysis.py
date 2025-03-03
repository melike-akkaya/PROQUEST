import pandas as pd
import numpy as np
from scipy.stats import spearmanr
import matplotlib.pyplot as plt

def readBlastFile(blastFilePath):
    blastData = {}
    with open(blastFilePath, 'r') as file:
        for line in file:
            parts = line.strip().split('\t')
            proteinId = parts[0].strip()
            similarProteins = [p.strip() for p in parts[3::2]]
            blastData[proteinId] = similarProteins
    return blastData

def readVectordbFile(vectordbFilePath):
    vectordbData = {}
    with open(vectordbFilePath, 'r') as file:
        for line in file:
            parts = line.strip().split(',')
            proteinId = parts[0].strip()
            similarProteins = [p.strip() for p in parts[3:]]
            vectordbData[proteinId] = similarProteins
    return vectordbData

def calculateSpearmanCorrelation(blastData, vectordbData, commonIds):
    rankings = []
    correlations = []
    for proteinId in commonIds:
        commonProteins = set(blastData[proteinId]).intersection(set(vectordbData[proteinId]))
        
        if len(commonProteins) > 1:
            blastRanks = [blastData[proteinId].index(protein) for protein in commonProteins]
            vectordbRanks = [vectordbData[proteinId].index(protein) for protein in commonProteins]
            
            correlation, pValue = spearmanr(blastRanks, vectordbRanks)
            rankings.append((proteinId, correlation, pValue))
            correlations.append(correlation)
    
    medianCorrelation = np.median(correlations)
    return rankings, medianCorrelation, correlations

def correlationAnalysis(blastData, vectordbData):
    commonIds = set(blastData.keys()).intersection(set(vectordbData.keys()))
    correlationResults, medianCorrelation, correlations = calculateSpearmanCorrelation(blastData, vectordbData, commonIds)

    with open('Spearman Correlation Analysis.txt', 'w') as file:
        file.write(f"Median Correlation Coefficient: {medianCorrelation}\n")
        for result in correlationResults:
            file.write(f"Protein ID: {result[0]}, Spearman Correlation Coefficient: {result[1]}, p-value: {result[2]}\n")

    plt.hist(correlations, bins=10, color='blue', alpha=0.7)
    plt.title('Distribution of Correlation Coefficients')
    plt.xlabel('Spearman Correlation Coefficient')
    plt.ylabel('Frequency')
    plt.ylim(0, 300)
    plt.show()

def compareCorrelation():
    labels = ['Euclidean, n=0', 'Manhattan, n=1000', 'Angular, n=1000', 'Manhattan, n=10000']
    values = [0.7075702075702076, 0.6686573293176465, 0.6693880695575611, 0.6648004703837207]
    distances = ['vectordb0', 'vectordb1', 'vectordb2', 'vectordb3']

    fig, ax = plt.subplots()
    bars = ax.bar(labels, values, color=['blue', 'green', 'red', 'purple'])

    ax.set_title('Comparison of Median Correlation Coefficients for Each Vector Database')
    ax.set_xticks(range(len(labels)), labels)
    ax.set_ylim(0.65, 0.72)  

    for bar, distance in zip(bars, distances):
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, yval + 0.001, distance, ha='center', va='bottom', fontsize=8, color='black')

    plt.show()
