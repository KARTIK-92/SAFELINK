#!/bin/sh
set -e

# Perform all actions as $POSTGRES_USER
"${psql[@]}" <<- 'EOSQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";
EOSQL
