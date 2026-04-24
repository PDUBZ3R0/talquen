#!/bin/bash

NUM=$(cat /tmp/Docker.num)
COMMAND=$1

declare -A messages
while IFS='=' read -r key value; do
    messages["$key"]="$value"
done < "/tmp/Docker.properties"
MESSAGE=${messages[$COMMAND]}

COMMNUM=$(($NUM + 1))
echo $COMMNUM > /tmp/Docker.num

executor(){
	case $COMMAND in

	  apt)
	    apt update && \
	    	apt dist-upgrade -y
	    ;;

	  deps)
	  	apt install -y \
	  		ca-certificates \
	  		curl \
	  		dbus-x11 \
	  		fonts-liberation \
	  		git \
	  		jq \
	  		libgtk-3-0 \
	  		libx11-xcb1 \
	  		libasound2 \
	  		python-is-python3 \
	  		wget \
	  		xvfb
	  	;;

	  uv)
	  	curl -LsSf https://astral.sh/uv/install.sh | sh
	  	ln -s $HOME/.local/bin/uv /usr/bin/uv
	  	;;

		cleanup)
			rm -rf /tmp/*
			rm -rf /root/.cache/*
			;;
			
	esac
}

case $P_DEBUG in
  on)
  	executor
  	;;
  *)
		echo "*** EXECUTING (COMMAND [$COMMNUM| $COMMAND ]): $MESSAGE"
		executor >> /var/log/install.log 2>&1
		echo
esac