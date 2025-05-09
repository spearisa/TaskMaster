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

  // Add a special endpoint to check if the DeepSite Docker is running
  app.get('/api/deepsite-status', async (_req: Request, res: Response) => {
    try {
      // Check if the DeepSite Docker container is accessible on port 7860
      const response = await fetch('http://localhost:7860/', { 
        method: 'HEAD',
        headers: { 'Accept': 'text/html' }
      });
      
      res.json({ 
        running: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: 'http://localhost:7860/'
      });
    } catch (error) {
      console.error('DeepSite container check failed:', error);
      res.json({ 
        running: false, 
        error: 'Connection failed', 
        message: 'The DeepSite container is not running or not accessible',
        dockerCommand: 'docker run -it -p 7860:7860 --platform=linux/amd64 registry.hf.space/enzostvs-deepsite:latest'
      });
    }
  });

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
    // Skip port 5000 as it's consistently in use
    const availablePorts = [
      3000, // Try this first since 5000 is occupied
      3001,
      3002,
      3003,
      4000,
      4001,
      4040,
      8080,
      8000,
      8888,
      9000
    ];
    
    let serverStarted = false;
    // Do not try to reuse the last port - start fresh
    for (const port of availablePorts) {
      try {
        log(`Attempting to start server on port ${port}...`);
        
        await new Promise<void>((resolve, reject) => {
          // Set a timeout to avoid hanging if connection takes too long
          const timeout = setTimeout(() => {
            log(`Timeout trying to connect to port ${port}, trying next port...`);
            server.removeAllListeners('listening');
            server.removeAllListeners('error');
            resolve(); // Continue to next port
          }, 15000); // Extended timeout for Replit
          
          server.once('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code === 'EADDRINUSE') {
              console.log(`Port ${port} is already in use, trying next port...`);
              server.close(); // Explicitly close the server
              server.removeAllListeners('listening');
              server.removeAllListeners('error');
              resolve(); // Continue to next port
            } else {
              reject(err);
            }
          });
          
          server.once('listening', () => {
            clearTimeout(timeout);
            log(`Server successfully started on port ${port}`);
            serverStarted = true;
            
            // Let the user know which port we're using - make it very visible
            console.log(`\n\n==================================================`);
            console.log(`🚀 Appmo server running successfully on port: ${port}`);
            console.log(`🔗 Access via: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`);
            console.log(`🐳 DeepSite Docker: To use the original DeepSite implementation:`);
            console.log(`   docker run -it -p 7860:7860 --platform=linux/amd64 registry.hf.space/enzostvs-deepsite:latest`);
            console.log(`==================================================\n\n`);
            
            resolve();
          });
          
          // Try to listen on this port
          server.listen(port, "0.0.0.0");
        });
        
        // If we reach here without moving to the next port, server started successfully
        if (serverStarted) {
          break;
        }
      } catch (err: any) {
        log(`Error starting server: ${err.message}`);
        if (port === availablePorts[availablePorts.length - 1]) {
          // If we've tried all ports and still failed, exit
          console.error(`\n❌ Failed to start server after trying all ports (${availablePorts.length} ports tried). Please restart the application.\n`);
          process.exit(1);
        }
      }
    }
    
    if (!serverStarted) {
      console.error(`\n❌ Could not find an available port. Please restart the application or check system resources.\n`);
      process.exit(1);
    }
  };
  
  // Start the server with fallback
  startServer();
})();