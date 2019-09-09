import sys

protocol = sys.argv[1]
with open(protocol) as protocol_data:
    protocol_data = protocol_data.readlines()

    lines = []
    for line in protocol_data:
        lines.append(line.split())

    sum_lines = 0
    for i in range(len(lines) - 1):
        if lines[i + 1] == []:
            break
        sum_lines += int((float(lines[i + 1][0]) - float(lines[i][0])) / float(lines[i][1]))
    
    print(sum_lines)