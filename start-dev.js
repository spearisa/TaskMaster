// Script to start the development server on a fixed port
import { spawn } from 'child_process';
const PORT = 8080;

console.log(`\n\n==================================================`);
console.log(`🚀 Starting Appmo server on port: ${PORT}`);
console.log(`==================================================\n\n`);

// Set the PORT environment variable and start the server
process.env.PORT = PORT.toString();
const server = spawn('tsx', ['server/index.ts'], {
  env: { ...process.env, PORT: PORT.toString() },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping server...');
  server.kill();
  process.exit(0);
});