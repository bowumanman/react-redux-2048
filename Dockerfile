FROM index.boxlinker.com/library/alpine-node:latest

RUN mkdir /app

COPY . /app


WORKDIR /app

EXPOSE 3000


CMD [“make”,”start"]
