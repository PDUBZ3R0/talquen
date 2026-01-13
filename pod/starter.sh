#!/bin/bash

sudo service dbus start

export BROWSER_BOT="/opt/chromium.org/chromium/chromium-browser"
export VERSION_BOT=$($BROWSER_BOT --version)
echo "$VERSION_BOT (location: $BROWSER_BOT)"

# export BROWSER_CHROME=$(which google-chrome)
# export VERSION_CHROME=$($BROWSER_CHROME --version)
# echo "$VERSION_CHROME (location: $BROWSER_CHROME)"

# export BROWSER_EDGE=$(which microsoft-edge)
# export VERSION_EDGE=$($BROWSER_EDGE --version)
# echo "$VERSION_EDGE (location: $BROWSER_EDGE)"

# export BROWSER_BRAVE=$(which brave-browser)
# export VERSION_BRAVE=$($BROWSER_BRAVE --version)
# echo "$VERSION_BRAVE (location: $BROWSER_BRAVE)"

# export BROWSER_OPERA=$(which opera)
# export VERSION_OPERA=$($BROWSER_OPERA --version)
# echo "$VERSION_OPERA (location: $BROWSER_OPERA)"

# sudo ./portfwd.sh

echo "/home/pptruser/profiles/"
ls /home/pptruser/profiles/ -al

node server.js