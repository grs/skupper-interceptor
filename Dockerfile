FROM ubi8/nodejs-12

RUN mkdir -p /opt/app-root/
WORKDIR /opt/app-root/

ADD package.json /opt/app-root/
RUN npm install
COPY bin/interceptor.js bin/interceptor.js

CMD ["node", "/opt/app-root/bin/interceptor.js"]
