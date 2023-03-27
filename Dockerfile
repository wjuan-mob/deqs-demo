FROM envoyproxy/envoy:v1.19.1

COPY envoy.yaml /etc/envoy/envoy.yaml

EXPOSE 8080 9901

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml
