import sys
import os

if __name__ == "__main__":
    directory = sys.argv[1]
    sample = int(sys.argv[2])

    f = open(os.path.join(directory, "result.csv"), "r")
    g = open(os.path.join(directory, "result_sampled.csv"), "w")

    index = 0
    for line in f:
        if index % sample == 0:
            g.write(line)
        index += 1

    f.close()
    g.close()
