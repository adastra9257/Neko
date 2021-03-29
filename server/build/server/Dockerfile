FROM node:lts-alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories \
    && apk update \
    && apk upgrade \
    && npm config set registry https://registry.npm.taobao.org \
    && cd ~ \
    && touch run.sh \
    && echo -e "#!/bin/ash" >> run.sh \
    && echo -e "cd /root/server/" >> run.sh \
    && echo -e "clear" >> run.sh \
    && echo -e "echo 'neko-server is running...'" >> run.sh \
    && echo -e "node index.js" >> run.sh \
    && chmod +x run.sh \
    && mkdir server \
    && cd server \
    && npm init -y \
    && npm install bufferutil utf-8-validate peer node-turn \
    && touch index.js \
    && echo -e "const { PeerServer } = require('peer');" >> index.js \
    && echo -e "const Turn = require('node-turn');" >> index.js \
    && echo -e "const peerServer = PeerServer({ port: 9000, path: '/myapp' });" >> index.js \
    && echo -e "let server = new Turn({" >> index.js \
    && echo -e "    // set options" >> index.js \
    && echo -e "    authMech: 'long-term'," >> index.js \
    && echo -e "    credentials: {" >> index.js \
    && echo -e "        guest: "123456"" >> index.js \
    && echo -e "    }" >> index.js \
    && echo -e "});" >> index.js \
    && echo -e "server.start();" >> index.js

CMD ["/bin/ash", "/root/run.sh"]

EXPOSE 3478/udp 9000