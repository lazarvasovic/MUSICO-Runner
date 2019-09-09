import sys
import os
import json

unit = sys.argv[1]

protocol_file = os.path.join(unit, 'protocol.dat')
result_file = os.path.join(unit, 'result.csv')

try:
    with open(protocol_file) as protocol_data:
        protocol_data = protocol_data.readlines()

    lines = []
    for line in protocol_data:
        lines.append(line.split())

    total_lines = 0
    for i in range(len(lines) - 1):
        if lines[i + 1] == []:
            break
        total_lines += int((float(lines[i + 1][0]) - float(lines[i][0])) / float(lines[i][1]))

    with open(result_file) as result_data:
        curr_lines = len(result_data.readlines())

    is_end = False
    if curr_lines >= total_lines:
        is_end = True

    result = {
        'isEnd': is_end,
        'progress': int(float(curr_lines) / total_lines * 100)
    }
except Exception as e:
    result = {
        'isEnd': False,
        'progress': 0
    }


print(json.dumps(result))