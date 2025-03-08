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

def calculateCommonProteinMetric(blastData, vectordbData, commonIds):
    metrics = []
    for proteinId in commonIds:
        blastProteins = set(blastData[proteinId])
        vectordbProteins = set(vectordbData[proteinId])
        commonProteins = blastProteins.intersection(vectordbProteins)
        
        numBlastProteins = len(blastProteins)
        numVectordbProteins = len(vectordbProteins)
        numCommonProteins = len(commonProteins)
        
        metric_value = (2 * numCommonProteins) / (numBlastProteins + numVectordbProteins)
        metrics.append((proteinId, metric_value))
    
    medianMetric = np.median([metric[1] for metric in metrics])
    return metrics, medianMetric

def analysis(blastData, vectordbData, n, distance, outputPath):
    commonIds = set(blastData.keys()).intersection(set(vectordbData.keys()))
    correlationResults, medianCorrelation, correlations = calculateSpearmanCorrelation(blastData, vectordbData, commonIds)
    commonProteinMetrics, medianMetric = calculateCommonProteinMetric(blastData, vectordbData, commonIds)

    with open(outputPath, 'w') as file:
        file.write(f"Median Correlation Coefficient: {medianCorrelation}\n")
        file.write(f"Median Common Protein Metric: {medianMetric}\n")
        for result, metric_result in zip(correlationResults, commonProteinMetrics):
            file.write(f"Protein ID: {result[0]}, Spearman Correlation Coefficient: {result[1]}, p-value: {result[2]}, Common Protein Metric: {metric_result[1]}\n")

    plt.figure(figsize=(12, 5))

    plt.subplot(1, 2, 1)
    plt.hist(correlations, bins=10, color='blue', alpha=0.7)
    plt.title(f'Distribution of Correlation Coefficients\nn={n} {distance}')
    plt.xlabel('Spearman Correlation Coefficient')
    plt.ylabel('Frequency')
    plt.ylim(0, 300)

    plt.subplot(1, 2, 2)
    metric_values = [metric[1] for metric in commonProteinMetrics]
    plt.hist(metric_values, bins=10, color='green', alpha=0.7)
    plt.title(f'Distribution of Common Protein Metric\nn={n} {distance}')
    plt.xlabel('Common Protein Metric')
    plt.ylabel('Frequency')
    plt.ylim(0, 300)

    plt.tight_layout()
    plt.show()

def compareCorrelation():
    labels = ['Euclidean\nn=0', 'Manhattan\nn=1000', 'Angular\nn=1000', 'Manhattan\nn=10000']
    coefficientValues = [0.7075702075702076, 0.6686573293176465, 0.6693880695575611, 0.6648004703837207]
    commonProteinValues = [0.2791666666666667, 0.384, 0.38877755511022044, 0.3880597014925373]
    distances = ['vectordb0', 'vectordb1', 'vectordb2', 'vectordb3']

    fig, axs = plt.subplots(1, 2, figsize=(12, 5))

    bars1 = axs[0].bar(labels, coefficientValues, color=['blue', 'green', 'red', 'purple'])
    axs[0].set_title('Comparison of Median Correlation Coefficients')
    axs[0].set_xticks(range(len(labels)))
    axs[0].set_xticklabels(labels)
    axs[0].set_ylim(0.65, 0.72)

    for bar, distance in zip(bars1, distances):
        yval = bar.get_height()
        axs[0].text(bar.get_x() + bar.get_width()/2, yval + 0.001, distance, ha='center', va='bottom', fontsize=8, color='black')

    bars2 = axs[1].bar(labels, commonProteinValues, color=['blue', 'green', 'red', 'purple'])
    axs[1].set_title('Comparison of Median Common Protein Values')
    axs[1].set_xticks(range(len(labels)))
    axs[1].set_xticklabels(labels)
    axs[1].set_ylim(0.25, 0.4)

    for bar, distance in zip(bars2, distances):
        yval = bar.get_height()
        axs[1].text(bar.get_x() + bar.get_width()/2, yval + 0.001, distance, ha='center', va='bottom', fontsize=8, color='black')

    plt.tight_layout()
    plt.show()