import re
import pandas as pd
import numpy as np

def load_records(filepath, delimiterPattern=r"^//[ \t]*\r?\n(?=ID)"):
    print(f"Loading records from {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    splitter = re.compile(delimiterPattern, flags=re.MULTILINE)
    raw_records = [chunk.strip() for chunk in splitter.split(content) if chunk.strip()]
    print(f"Loaded {len(raw_records)} records")

    cleaned_records = []
    for record in raw_records:
        lines = record.splitlines()
        cleaned_lines = []
        in_sequence = False
        for line in lines:
            if line.startswith('SQ') or line.startswith(' ') or line.startswith("CC"):
                in_sequence = True
                continue
            if in_sequence:
                continue
            cleaned_lines.append(line)
        cleaned_record = '\n'.join(cleaned_lines).strip()
        if cleaned_record:
            cleaned_records.append(cleaned_record)

    return cleaned_records

def calculateRecordLengths(records):
    return [len(record) for record in records]

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
    records = load_records(filePath)
    recordLengths = calculateRecordLengths(records)
    printFormattedTable(recordLengths)

filePath = 'backend/asset/uniprot_sprot.dat'
processUniprotFile(filePath)
