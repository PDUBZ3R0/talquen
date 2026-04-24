# syntax=docker/dockerfile:1

FROM docker.io/debian:trixie-slim

ENV P_DEBUG=off

ENV DXVFB=99
ENV LANG=en_US.UTF-8

COPY Docker.* /tmp

RUN /tmp/Docker.sh apt
RUN /tmp/Docker.sh deps
RUN /tmp/Docker.sh uv
RUN /tmp/Docker.sh cleanup