import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkDatabaseConnection, createDatabaseTables } from "./db";
import { storage, DatabaseStorage } from "./storage";
import { Server } from 'socket.io'; // Added import for Socket.IO
import { createServer as createHttpServer } from 'http';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    log("Database connection successful");

    // First, create the tables
    try {
      await createDatabaseTables();
      log("Database tables created successfully");

      // Then initialize demo data
      if (storage instanceof DatabaseStorage) {
        await storage.initializeDemo();
        log("Database initialization complete");
      }
    } catch (err) {
      const error = err as Error;
      log(`Database initialization error: ${error.message}`);
    }
  } else {
    log("WARNING: Database connection failed, check your configuration");
  }

  const server = await registerRoutes(app);

  // Setup Socket.io
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"]
    },
    cookie: true
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('send_message', (data) => {
      io.to(data.room).emit('receive_message', {
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server with port fallback for Replit compatibility
  const startServer = async () => {
    // Expanded range of ports to try
    const availablePorts = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010, 3000, 3001, 3002, 8000, 8001, 8080, 8081];
    
    // Try to get a previous port from storage to avoid the same port
    let lastPortUsed = Number(process.env.LAST_PORT_USED || '0');
    
    // Also check for a saved port file from previous runs
    try {
      const fs = require('fs');
      if (fs.existsSync('.port.txt')) {
        const savedPort = Number(fs.readFileSync('.port.txt', 'utf8').trim());
        if (savedPort > 0) {
          lastPortUsed = savedPort;
          log(`Found previously used port ${lastPortUsed} in .port.txt`);
        }
      }
    } catch (e) {
      // Non-critical if this fails
    }
    if (lastPortUsed > 0) {
      // Move the last used port to the end of the array to try other ports first
      const index = availablePorts.indexOf(lastPortUsed);
      if (index !== -1) {
        availablePorts.splice(index, 1);
        availablePorts.push(lastPortUsed);
      }
    }
    
    for (const port of availablePorts) {
      try {
        await new Promise<void>((resolve, reject) => {
          // Set a timeout to avoid hanging if connection takes too long
          const timeout = setTimeout(() => {
            log(`Timeout trying to connect to port ${port}, trying next port...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            resolve(); // Continue to next port
          }, 1000);
          
          server.once('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code === 'EADDRINUSE') {
              log(`Port ${port} is already in use, trying next port...`);
              server.removeAllListeners('listening');
              server.removeAllListeners('error');
              resolve(); // Continue to next port
            } else {
              reject(err);
            }
          });
          
          server.once('listening', () => {
            clearTimeout(timeout);
            // Save the current port to process.env so we can avoid it next time
            process.env.LAST_PORT_USED = String(port);
            log(`Server successfully started on port ${port}`);
            
            // Let the user know which port we're using
            console.log(`\n\n--------------------------------------------`);
            console.log(`🚀 Appmo server running on port: ${port}`);
            console.log(`--------------------------------------------\n\n`);
            
            // Save to a file for persistence across restarts
            try {
              const fs = require('fs');
              fs.writeFileSync('.port.txt', String(port));
            } catch (e) {
              // Non-critical if this fails
            }
            
            resolve();
          });
          
          // Try to listen on this port
          server.listen(port, "0.0.0.0");
        });
        
        // If we reach here without moving to the next port, server started successfully
        break;
      } catch (err: any) {
        log(`Error starting server: ${err.message}`);
        if (port === availablePorts[availablePorts.length - 1]) {
          // If we've tried all ports and still failed, exit
          console.error(`\n❌ Failed to start server after trying all ports. Please restart the application.\n`);
          process.exit(1);
        }
      }
    }
  };
  
  // Start the server with fallback
  startServer();
})();