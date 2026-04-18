#!/bin/bash
# init-pg.sh — Create both databases on first PostgreSQL startup
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE portal_smpit;
    CREATE DATABASE tu_smpit;
EOSQL
