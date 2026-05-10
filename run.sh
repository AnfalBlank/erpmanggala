#!/bin/bash

# Function to kill background processes on exit
cleanup() {
  echo "Shutting down..."
  kill $SERVER_PID $CLIENT_PID
  exit
}

trap cleanup SIGINT SIGTERM

echo "Starting ERP Manggala..."

# Start Server
cd server
npm start &
SERVER_PID=$!
cd ..

# Start Client
cd client
npm run dev &
CLIENT_PID=$!
cd ..

wait
