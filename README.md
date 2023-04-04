Start the deqs first by running a command similar to:
    MC_LOG=trace IAS_MODE=DEV SGX_MODE=SW cargo run --bin deqs-server -- --client-listen-uri insecure-deqs://0.0.0.0/ --db-path {sqllite_path} --ledger-db {ledgerdb_path}

Then you can start the envoy to connect to the deqs using:
docker build -t envoy-instance .
docker run -d --name envoy-instance -p 9090:9090 -p 9901:9901 envoy-instance

Then you can start the app using:
npm start