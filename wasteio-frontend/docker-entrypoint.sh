#!/bin/sh
envsubst < /usr/share/nginx/html/window.config.js > /tmp/window.config.js
mv /tmp/window.config.js /usr/share/nginx/html/window.config.js
exec nginx -g "daemon off;"
