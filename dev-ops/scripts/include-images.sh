#!/bin/bash

curl -O -L -C -  http://minecraft-ids.grahamedgecombe.com/items.zip && \
    mv items.zip ../../build/static/ && \
    cd ../../build/static && \
    unzip items.zip