#!/bin/bash

echo
echo "***** MKDIR PROJECT LOG DIR (/var/log/talquen) *****"
mkdir -p /var/log/talquen/

echo
echo "***** UV SYNC/LOCK: (INSTALL PROJECT PYTHON DEPENDENCIES) *****"
cd /opt/talquen
uv sync
uv lock

echo
echo "***** INSTALL CAMOUFOX *****"
source .venv/bin/activate
python -m camoufox fetch

rm -rf /tmp/*
rm -rf /root/.cache/*

echo
echo "#########################"
echo ">>>>> ALL DONE SON! <<<<<"
echo "#########################"