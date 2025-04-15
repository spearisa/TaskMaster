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

  // Try ports in sequence 5000, 5001, 5002, etc
  const tryListen = (port = 5000, maxPort = 5010) => {
    try {
      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        log(`serving on port ${port}`);
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE' && port < maxPort) {
          log(`Port ${port} is already in use, trying port ${port + 1}...`);
          server.close();
          tryListen(port + 1, maxPort);
        } else {
          log(`Server error: ${err.message}`);
        }
      });
    } catch (err: any) {
      log(`Error starting server: ${err.message}`);
      if (err.code === 'EADDRINUSE' && port < maxPort) {
        log(`Port ${port} is already in use, trying port ${port + 1}...`);
        tryListen(port + 1, maxPort);
      }
    }
  };
  
  tryListen();
})();