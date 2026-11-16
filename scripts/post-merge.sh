#!/bin/bash
set -e
npm install
# Replit development database only; live cPanel migrations are applied manually.
npm run db:push
