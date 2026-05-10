#!/bin/sh
KUBE_DNS=$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}')
sed -i "s/__KUBE_DNS__/$KUBE_DNS/g" /etc/nginx/conf.d/default.conf

envsubst < /usr/share/nginx/html/window.config.js > /tmp/window.config.js
mv /tmp/window.config.js /usr/share/nginx/html/window.config.js

exec nginx -g "daemon off;"
