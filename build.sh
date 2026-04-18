#!/bin/bash
set -e
cd /home/ubuntu/erp-manggala

# ============================================
# BACKEND SETUP
# ============================================
mkdir -p server/routes server/middleware server/db

# Install backend deps
cd server
npm init -y 2>/dev/null
npm install express cors bcrypt jsonwebtoken better-sqlite3 multer dotenv 2>&1 | tail -3
cd ..

# ============================================
# FRONTEND SETUP  
# ============================================
cd client
npm install 2>&1 | tail -3
cd ..

echo "=== Dependencies installed ==="
