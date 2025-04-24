import pandas as pd
import numpy as np

def readAndSplitFile(filePath):
    with open(filePath, 'r') as file:
        content = file.read()
    records = content.split('//')
    return records

def calculateRecordLengths(records):
    lengths = [len(record.strip()) for record in records if record.strip()]
    return lengths

def calculateBasicStatistics(recordLengths):
    maxLength = max(recordLengths)
    minLength = min(recordLengths)
    meanLength = np.mean(recordLengths)
    
    return maxLength, minLength, meanLength

def calculateTotalLength(recordLengths):
    return sum(recordLengths)

def countRecordsByLengthRange(recordLengths):
    ranges = [0, 100000, 200000, 300000, 400000, 500000]
    counts = [0] * (len(ranges) - 1)

    for length in recordLengths:
        for i in range(len(ranges) - 1):
            if ranges[i] <= length < ranges[i + 1]:
                counts[i] += 1
                break

    return counts, ranges

def printFormattedTable(recordLengths):
    maxLength, minLength, meanLength = calculateBasicStatistics(recordLengths)
    totalLength = calculateTotalLength(recordLengths)
    counts, ranges = countRecordsByLengthRange(recordLengths)

    print("\nStatistics of Protein Record Lengths:")
    print("="*50)
    
    data = {
        "Statistic": ["Max Length", "Min Length", "Mean Length", "Total Length"],
        "Value": [maxLength, minLength, f"{meanLength:.2f}", totalLength]
    }

    df = pd.DataFrame(data)
    print(df.to_string(index=False))
    print("="*50)
    
    print("\nDistribution of Record Lengths by Range:")
    print("="*50)
    
    rangeLabels = [f"{ranges[i]} - {ranges[i+1]}" for i in range(len(ranges)-1)]
    rangeData = {
        "Length Range": rangeLabels,
        "Count": counts
    }
    
    dfRange = pd.DataFrame(rangeData)
    print(dfRange.to_string(index=False))
    print("="*50)

def processUniprotFile(filePath):
    records = readAndSplitFile(filePath)
    recordLengths = calculateRecordLengths(records)

    printFormattedTable(recordLengths)

filePath = 'backend/asset/uniprot_sprot.dat'

processUniprotFile(filePath)
