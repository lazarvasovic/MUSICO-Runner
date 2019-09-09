#!/bin/bash

DIR="$1"
find "$DIR" -mindepth 1 -maxdepth 1 -type d | while read FOLDER; do
    echo -n "$FOLDER "
    cd "$FOLDER"
    cp "$DIR/MusicoExeFinal" "$FOLDER"
    cp "$DIR/startM.sub" "$FOLDER"
    qsub startM.sub
    cd "$DIR"
done
