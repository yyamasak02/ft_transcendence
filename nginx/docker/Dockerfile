FROM nginx:latest

COPY ./config/nginx.conf /etc/nginx/nginx.conf

COPY ./setting/init-nginx.sh /usr/local/bin/init-nginx.sh
RUN chmod +x /usr/local/bin/init-nginx.sh

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/init-nginx.sh"]
CMD ["nginx", "-g", "daemon off;"]
