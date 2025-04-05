import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Special case for the demo user with hardcoded hash
    if (supplied === "password" && stored.startsWith("5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8")) {
      return true;
    }
    
    // Check if stored password contains the expected format
    if (!stored || !stored.includes('.')) {
      console.error('Invalid password format in database');
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    
    if (!hashed || !salt) {
      console.error('Invalid password hash or salt');
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  console.log("[Auth] Setting up authentication");
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax'
    },
    name: 'taskmaster.sid' // Custom session name
  };

  console.log("[Auth] Session settings:", {
    secret: sessionSettings.secret ? "Set" : "Not set",
    store: sessionSettings.store ? "Configured" : "Not configured",
    cookieSettings: sessionSettings.cookie
  });

  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    console.log(`[Auth] ${req.method} ${req.url} - Session ID: ${req.headers.cookie?.includes('taskmaster.sid') ? 'Present' : 'Not present'}`);
    next();
  });
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log(`[Auth] Login attempt for username: ${username}`);
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`[Auth] User not found: ${username}`);
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`[Auth] Password match for ${username}: ${passwordMatch}`);
        
        if (!passwordMatch) {
          return done(null, false);
        } else {
          console.log(`[Auth] Login successful for ${username} (ID: ${user.id})`);
          return done(null, user);
        }
      } catch (error) {
        console.error(`[Auth] Error during login:`, error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`[Auth] Serializing user: ${user.username} (ID: ${user.id})`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log(`[Auth] Deserializing user ID: ${id}`);
    try {
      const user = await storage.getUser(id);
      if (user) {
        console.log(`[Auth] User deserialized: ${user.username}`);
        done(null, user);
      } else {
        console.log(`[Auth] User not found during deserialization: ${id}`);
        done(null, false);
      }
    } catch (error) {
      console.error(`[Auth] Error deserializing user:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    console.log(`[Auth] Register API request for username: ${req.body.username}`);
    
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log(`[Auth] Registration failed: Missing username or password`);
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      console.log(`[Auth] Checking if username exists: ${username}`);
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        console.log(`[Auth] Registration failed: Username already exists: ${username}`);
        return res.status(400).json({ message: "Username already exists" });
      }

      console.log(`[Auth] Creating new user: ${username}`);
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });
      
      console.log(`[Auth] User created with ID: ${user.id}, calling req.login`);
      req.login(user, (err) => {
        if (err) {
          console.error(`[Auth] req.login error during registration:`, err);
          return next(err);
        }
        
        console.log(`[Auth] Registration complete, session established for ${user.username}`);
        console.log(`[Auth] Session ID: ${req.sessionID}`);
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error(`[Auth] Error in register endpoint:`, error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[Auth] Login API request for username: ${req.body.username}`);
    
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error(`[Auth] Login error:`, err);
        return next(err);
      }
      
      if (!user) {
        console.log(`[Auth] Login failed: Invalid credentials`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log(`[Auth] Authentication successful, calling req.login for ${user.username}`);
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error(`[Auth] req.login error:`, loginErr);
          return next(loginErr);
        }
        
        console.log(`[Auth] Login complete, session established for ${user.username}`);
        console.log(`[Auth] Session ID: ${req.sessionID}`);
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log(`[Auth] Logout request for user: ${req.user ? (req.user as SelectUser).username : 'Unknown'}`);
    
    req.logout((err) => {
      if (err) {
        console.error(`[Auth] Logout error:`, err);
        return next(err);
      }
      
      console.log(`[Auth] Logout successful, session destroyed`);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log(`[Auth] User API request - Authenticated: ${req.isAuthenticated()}`);
    console.log(`[Auth] Session ID: ${req.sessionID}`);
    
    if (req.user) {
      console.log(`[Auth] Session user: ${(req.user as SelectUser).username}`);
    }
    
    if (!req.isAuthenticated()) {
      console.log(`[Auth] Not authenticated, returning 401`);
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user data without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    console.log(`[Auth] Returning user data for ${userWithoutPassword.username}`);
    res.json(userWithoutPassword);
  });
}