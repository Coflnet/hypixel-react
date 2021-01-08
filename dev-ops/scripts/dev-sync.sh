#!/bin/bash
ssh flo@flou21.de 'rm -rf /home/flo/hypixel/ah/files' && \
  cd /home/muehlhans/priv/hypixel-react/
  git checkout master && \
  git pull && \
  npm run build && \
  cd build && \
  rsync -r --progress . flo@flou21.de:/home/flo/hypixel/ah/files
