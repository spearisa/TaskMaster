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
        dockerCommand: `docker run -it -p 7860:7860 --platform=linux/amd64 \\
  -e OAUTH_CLIENT_ID="YOUR_VALUE_HERE" \\
  -e OAUTH_CLIENT_SECRET="YOUR_VALUE_HERE" \\
  -e DEFAULT_HF_TOKEN="YOUR_VALUE_HERE" \\
  -e APP_PORT="5173" \\
  -e REDIRECT_URI="https://enzostvs-deepsite.hf.space/auth/login" \\
  registry.hf.space/enzostvs-deepsite:latest`
      });
    }
  });
  
  // Server info endpoint for debugging
  app.get('/api/server-info', (_req: Request, res: Response) => {
    try {
      res.json({
        status: 'running',
        port: parseInt(process.env.PORT || '3001'),
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error getting server info:", error);
      res.status(500).json({ error: "Failed to get server info" });
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

  // Add server info endpoint to help debug port and API issues
  app.get('/api/server-info', (_req: Request, res: Response) => {
    const serverInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      port: process.env.PORT || 'not set',
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        REPL_SLUG: process.env.REPL_SLUG || 'not set',
        REPL_OWNER: process.env.REPL_OWNER || 'not set'
      },
      apis: {
        deepseekApiKey: process.env.DEEPSEEK_API_KEY ? `present (${process.env.DEEPSEEK_API_KEY.length} chars)` : 'not set',
        huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY ? `present (${process.env.HUGGINGFACE_API_KEY.length} chars)` : 'not set',
        huggingfaceApiToken: process.env.HUGGINGFACE_API_TOKEN ? `present (${process.env.HUGGINGFACE_API_TOKEN.length} chars)` : 'not set',
        openaiApiKey: process.env.OPENAI_API_KEY ? `present (${process.env.OPENAI_API_KEY.length} chars)` : 'not set'
      }
    };
    res.json(serverInfo);
  });

  // Add endpoint to check DeepSite integration status
  app.get('/api/deepsite-status', async (_req: Request, res: Response) => {
    try {
      // Check if DeepSeek API key is available
      const hasDeepSeekKey = !!process.env.DEEPSEEK_API_KEY;
      
      // Check if Hugging Face tokens are available
      const hasHuggingfaceToken = !!process.env.HUGGINGFACE_API_TOKEN;
      const hasHuggingfaceKey = !!process.env.HUGGINGFACE_API_KEY;
      
      // Check if we can fall back to OpenAI
      const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
      
      res.json({
        status: 'available',
        providers: {
          deepseek: hasDeepSeekKey,
          huggingface: hasHuggingfaceToken || hasHuggingfaceKey,
          openai: hasOpenAiKey
        },
        port: process.env.PORT || 'unknown',
        message: 'DeepSite integration ready to use'
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Unknown error checking DeepSite status',
        error: error.toString()
      });
    }
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
    // For Cloud Run deployments, use the PORT environment variable or default to 8080
    if (process.env.NODE_ENV === "production") {
      const port = process.env.PORT || '8080';
      process.env.PORT = port;
      server.listen(parseInt(port), "0.0.0.0");
      log(`Server started on production port ${port}`);
      return;
    }
    
    // For development, try different ports
    const availablePorts = [
      3001,  // Success reported with this port in logs
      5000,  // Replit workflow expects this port
      3002,  // Alternative Node.js port
      5001,  // Alternative to 5000
      4000,  // Another common development port
      4001,  // Alternative to 4000
      9090,  // Higher port less likely to be in use
      7777,  // Higher port less likely to be in use
      8888,  // Higher port less likely to be in use
      9876,  // Higher port less likely to be in use
      // Only try these common ports later as they're likely to be in use
      3000,  // Common Node.js port (often busy)
      8080,  // Common alternative HTTP port (often busy)
      8000,  // Another common HTTP alternative (often busy)
      // Additional fallback options
      6789,
      4444,
      3003,
      9999,
      4321,
      10001,
      12345,
      8765
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
          }, 30000); // Extended timeout for Replit
          
          server.once('error', (err: any) => {
            clearTimeout(timeout);
            if (err.code === 'EADDRINUSE') {
              console.log(`Port ${port} is already in use, trying next port...`);
              
              // Add more diagnostic information
              console.log(`This is a common issue with Replit. We'll try another port automatically.`);
              
              // Force close the server and clean up event listeners
              try {
                server.close();
              } catch (closeErr: any) {
                console.log(`Note: Error while closing server: ${closeErr?.message || 'Unknown error'}`);
              }
              
              server.removeAllListeners('listening');
              server.removeAllListeners('error');
              
              // Add a small delay before trying the next port to let things clean up
              setTimeout(() => {
                resolve(); // Continue to next port
              }, 500);
            } else {
              console.log(`Server error on port ${port}: ${err.message} (${err.code})`);
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
            console.log(`🔌 API Status: Verifying API credentials...`);
            
            // Show API key status
            const deepSeekKeyStatus = process.env.DEEPSEEK_API_KEY ? 
              (process.env.DEEPSEEK_API_KEY.startsWith('sk-') ? '✅ Valid format (sk-...)' : '⚠️ Invalid format (should start with sk-)') 
              : '❌ Missing';
              
            const huggingFaceKeyStatus = process.env.HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_KEY ?
              '✅ Available' : '❌ Missing';
            
            console.log(`   DeepSeek API Key: ${deepSeekKeyStatus}`);
            console.log(`   Hugging Face API: ${huggingFaceKeyStatus}`);
            
            console.log(`🐳 DeepSite Docker: To use the original DeepSite implementation:`);
            console.log(`   docker run -it -p 7860:7860 --platform=linux/amd64 \\`);
            console.log(`     -e OAUTH_CLIENT_ID="YOUR_VALUE_HERE" \\`);
            console.log(`     -e OAUTH_CLIENT_SECRET="YOUR_VALUE_HERE" \\`);
            console.log(`     -e DEFAULT_HF_TOKEN="YOUR_VALUE_HERE" \\`);
            console.log(`     -e APP_PORT="5173" \\`);
            console.log(`     -e REDIRECT_URI="https://enzostvs-deepsite.hf.space/auth/login" \\`);
            console.log(`     registry.hf.space/enzostvs-deepsite:latest`);
            console.log(`==================================================\n\n`);
            
            resolve();
          });
          
          // Try to listen on this port
          process.env.PORT = port.toString();
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