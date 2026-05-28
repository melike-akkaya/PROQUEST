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
            blastRanks = [blastData[proteinId].index(p) for p in commonProteins]
            vectordbRanks = [vectordbData[proteinId].index(p) for p in commonProteins]

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

    meanMetric = np.mean([m[1] for m in metrics])
    return metrics, meanMetric


def analysis(blastData, vectordbData, n, distance, outputPath):
    commonIds = set(blastData.keys()).intersection(set(vectordbData.keys()))

    correlationResults, medianCorrelation, correlations = calculateSpearmanCorrelation(
        blastData, vectordbData, commonIds
    )

    commonProteinMetrics, meanMetric = calculateCommonProteinMetric(
        blastData, vectordbData, commonIds
    )

    with open(outputPath, 'w') as file:
        file.write(f"Median Correlation Coefficient: {medianCorrelation}\n")
        file.write(f"Average Common Protein Metric: {meanMetric}\n")

        for result, metric_result in zip(correlationResults, commonProteinMetrics):
            file.write(
                f"Protein ID: {result[0]}, "
                f"Spearman Correlation Coefficient: {result[1]}, "
                f"p-value: {result[2]}, "
                f"Common Protein Metric: {metric_result[1]}\n"
            )

    metric_values = [m[1] for m in commonProteinMetrics]

    fig, axes = plt.subplots(1, 2, figsize=(15, 6), constrained_layout=True)

    fig.suptitle(
        "Comparison of SeqSim and BLAST Results",
        fontsize=16,
        fontweight="bold"
    )

    # LEFT: Spearman Correlation
    axes[0].hist(
        correlations,
        bins=12,
        color="steelblue",
        alpha=0.85,
        edgecolor="black"
    )
    axes[0].set_title("Spearman Rank Correlation", fontsize=13, fontweight="bold")
    axes[0].set_xlabel("Spearman Correlation Coefficient", fontsize=11)
    axes[0].set_ylabel("Frequency", fontsize=11)
    axes[0].grid(True, linestyle="--", alpha=0.3)

    # RIGHT: Common Protein Metric
    axes[1].hist(
        metric_values,
        bins=12,
        color="seagreen",
        alpha=0.85,
        edgecolor="black"
    )
    axes[1].set_title("Common Protein Metric", fontsize=13, fontweight="bold")
    axes[1].set_xlabel("Common Protein Metric", fontsize=11)
    axes[1].set_ylabel("Frequency", fontsize=11)
    axes[1].grid(True, linestyle="--", alpha=0.3)

    plt.savefig(
        "figure7_seqsim_blast.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.show()

# blastData = readBlastFile("blast.txt")
# vectordbData = readVectordbFile("vectordb3.txt")
# analysis(blastData, vectordbData, 10, "euclidean", "analysis3.txt")
def compareCorrelation():
    labels = ['Euclidean\nn=0', 'Manhattan\nn=1000', 'Angular\nn=1000', 'Manhattan\nn=10000']
    coefficientValues = [0.7075702075702076, 0.6686573293176465, 0.6693880695575611, 0.6648004703837207]
    commonProteinValues = [0.3304795402222534, 0.40307894309573516, 0.4052184699935119, 0.4089126499589756]
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
    axs[1].set_title('Comparison of Average Common Protein Values')
    axs[1].set_xticks(range(len(labels)))
    axs[1].set_xticklabels(labels)
    axs[1].set_ylim(0.30, 0.42)

    for bar, distance in zip(bars2, distances):
        yval = bar.get_height()
        axs[1].text(bar.get_x() + bar.get_width()/2, yval + 0.001, distance, ha='center', va='bottom', fontsize=8, color='black')

    plt.tight_layout()
    plt.show()
)