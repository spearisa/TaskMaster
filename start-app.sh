#!/bin/bash

# Kill any existing node processes to clear ports
echo "Stopping any existing Node processes..."
pkill -f "node|tsx" || true
sleep 2  # Give processes time to shut down

# Choose a port that's likely to be available
# Try several ports in sequence
PORTS=(5000 5001 3001 3002 3003 3004 3005 8888 9999)

for PORT in "${PORTS[@]}"; do
  echo "Attempting to start server on port $PORT..."
  
  # Export the port for the Node.js process
  export PORT=$PORT
  
  # Start the application with the current port
  npm run dev &
  
  # Get the PID of the last background process
  APP_PID=$!
  
  # Wait for the server to start or fail
  sleep 5
  
  # Check if the process is still running
  if kill -0 $APP_PID 2>/dev/null; then
    echo "🚀 Server successfully started on port $PORT (PID: $APP_PID)"
    echo "You can now access the application at:"
    echo "http://localhost:$PORT"
    
    # Keep the script running to maintain the process
    wait $APP_PID
    exit 0
  else
    echo "❌ Failed to start on port $PORT, trying next port..."
  fi
done

echo "❌ Failed to start the server on any port. Please check for blocking processes."
exit 1