# syntax=docker/dockerfile:1

FROM node:22

ENV LANG=en_US.UTF-8 
ENV PPTRUSER_UID=10042
ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:
ENV BOT_VMAJ=143
ENV BOT_VMIN=0.7499.194
ENV BOT_DATE=20260108


# Update all packages from base image
##================================## 
RUN apt update && apt dist-upgrade -y

# Dependencies
##================================## 
RUN apt-get install -y \
    xvfb dbus-x11 ca-certificates \
    libnss3 libxss1 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libgbm1 libgtk-3-0 libdrm2 libxcomposite1 libxdamage1 \
    libxrandr2 libxkbcommon0 libpangocairo-1.0-0 libpango-1.0-0 \
    libwayland-client0 libwayland-server0 libdbus-1-3 libatspi2.0-0 \
    fonts-liberation libu2f-udev libcurl3-gnutls libcurl4 libvulkan1 xdg-utils \
    curl sudo

# Add pptruser.
##================================## 
RUN groupadd -r pptruser && useradd -u $PPTRUSER_UID -rm -g pptruser -G audio,video pptruser

# Create NOPASSWD sudo entry
##================================##
RUN echo "pptruser ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/pptruser
RUN chmod 440 /etc/sudoers.d/pptruser


# Install BotBrowser
##================================##
RUN wget https://github.com/botswin/BotBrowser/releases/download/$BOT_VMAJ.$BOT_VMIN/botbrowser_$( echo $BOT_DATE )_$(echo $BOT_VMAJ).$( echo $BOT_VMIN )_x86_64.deb -O /tmp/bot.deb
RUN apt install /tmp/bot.deb -y


# APT cleanup 
##================================##
RUN apt autoremove -y && apt clean
RUN npm install -g npm@latest
RUN npm install -g bun
RUN rm -rf /root/.cache/apt/ 


# Setup User Space
##================================##
USER pptruser

RUN mkdir -p /home/pptruser/profiles/
RUN wget https://github.com/botswin/BotBrowser/blob/main/profiles/v$BOT_VMAJ/chrome$(echo $BOT_VMAJ)_android13.enc -O /home/pptruser/profiles/android.enc
RUN wget https://github.com/botswin/BotBrowser/blob/main/profiles/v$BOT_VMAJ/chrome$(echo $BOT_VMAJ)_mac_arm64.enc -O /home/pptruser/profiles/mac.enc
RUN wget https://github.com/botswin/BotBrowser/blob/main/profiles/v$BOT_VMAJ/chrome$(echo $BOT_VMAJ)_win10_x64.enc -O /home/pptruser/profiles/win.enc

WORKDIR /home/pptruser/
RUN cd /home/pptruser/
COPY package.json *.js* *.sh .
RUN bun install
RUN rm -rf /home/pptruser/.cache/bun/
RUN rm -rf /home/pptruser/.cache/npm/

CMD ["bash", "starter.sh"]
