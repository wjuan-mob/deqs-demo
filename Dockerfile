FROM envoyproxy/envoy:v1.11.2

COPY ./envoy.yaml /etc/envoy/envoy.yaml

CMD /usr/local/bin/envoy -c /etc/envoy/envoy.yaml -l trace --log-path /tmp/envoy_info.log

# docker build -t learn-grpc-web3 .
# docker run -d --name learn-grpc-web -p 9090:9090 -p 9901:9901 learn-grpc-web3