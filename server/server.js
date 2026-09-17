import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;
const AUTH_TOKEN = "demo-token";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);

app.use(express.json());

const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@viek.test",
    password: "password123"
  }
];

let clients = [
  {
    id: 1,
    name: "Acme Limited",
    email: "contact@acme.test"
  },
  {
    id: 2,
    name: "Bright Solutions",
    email: "hello@bright.test"
  }
];

const projects = [
  {
    id: 1,
    name: "Website Development",
    clientId: 1
  },
  {
    id: 2,
    name: "Mobile Application",
    clientId: 2
  },
  {
    id: 3,
    name: "UI/UX Design",
    clientId: 1
  }
];

function isNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidEmail(value) {
  return (
    isNonEmptyString(value) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

function parsePositiveInteger(value) {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue)
    ? parsedValue
    : null;
}

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    !isNonEmptyString(email) ||
    !isNonEmptyString(password)
  ) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (item) =>
      item.email === normalizedEmail &&
      item.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const { password: unusedPassword, ...safeUser } = user;

  return res.json({
    token: AUTH_TOKEN,
    user: safeUser
  });
});

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  next();
}

// Get clients
app.get("/api/clients", authenticate, (req, res) => {
  res.json({
    data: clients
  });
});

// Add client
app.post("/api/clients", authenticate, (req, res) => {
  const { name, email } = req.body ?? {};

  if (!isNonEmptyString(name)) {
    return res.status(400).json({
      message: "Client name is required"
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "A valid client email is required"
    });
  }

  const nextId =
    clients.reduce(
      (highestId, client) =>
        Math.max(highestId, client.id),
      0
    ) + 1;

  const newClient = {
    id: nextId,
    name: name.trim(),
    email: email.trim()
  };

  clients.push(newClient);

  return res.status(201).json({
    data: newClient
  });
});

// Delete client
app.delete("/api/clients/:id", authenticate, (req, res) => {
  const id = parsePositiveInteger(req.params.id);

  if (id === null) {
    return res.status(400).json({
      message: "Client ID must be a positive integer"
    });
  }

  const clientIndex = clients.findIndex(
    (client) => client.id === id
  );

  if (clientIndex === -1) {
    return res.status(404).json({
      message: "Client not found"
    });
  }

  clients.splice(clientIndex, 1);

  return res.json({
    message: "Client deleted successfully"
  });
});

// Get projects
app.get("/api/projects", authenticate, (req, res) => {
  const { clientId } = req.query;

  if (clientId === undefined || clientId === "") {
    return res.json({
      projects
    });
  }

  const parsedClientId = parsePositiveInteger(clientId);

  if (parsedClientId === null) {
    return res.status(400).json({
      message: "Client ID must be a positive integer"
    });
  }

  const result = projects.filter(
    (project) => project.clientId === parsedClientId
  );

  return res.json({
    projects: result
  });
});

// JSON response for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API route not found"
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status =
    Number.isInteger(err.status) &&
    err.status >= 400 &&
    err.status < 500
      ? err.status
      : 500;

  const message =
    status === 400
      ? "Invalid JSON request body"
      : "Internal server error";

  res.status(status).json({
    message
  });
});

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});