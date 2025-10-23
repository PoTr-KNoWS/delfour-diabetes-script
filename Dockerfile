FROM node:22

WORKDIR /usr/src/app

COPY . .

RUN npm i

EXPOSE 5000

ENTRYPOINT [ "/bin/sh", "-c" ]
CMD [ "npm run setup && npm run dev:ui -- --host --port 5000" ]
