#!/bin/bash

DIR="$1"
exe="$2"
find "$DIR" -mindepth 1 -maxdepth 1 -type d | while read FOLDER; do
    echo -n "$FOLDER "
    cd "$FOLDER"
    cp "$DIR/$exe" "$FOLDER"
    cp "$DIR/startM-sync.sub" "$FOLDER"
    qsub -v exe="$exe" startM.sub
    cd "$DIR"
done

while [ `qstat -u lvasovic | grep BlockingJobs | wc -l` -gt 0 ]; do
    sleep 1
done
