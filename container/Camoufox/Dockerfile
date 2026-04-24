# syntax=docker/dockerfile:1

FROM talquen-basix

ENV LANG=en_US.UTF-8

COPY Docker.* /tmp

WORKDIR /opt/talquen
COPY talquen/* /opt/talquen/

RUN apt update && apt full-upgrade
RUN /tmp/Docker.sh

CMD /bin/bash /opt/talquen/talquen.sh
