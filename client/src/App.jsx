import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:4000/api";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      "Unable to connect to the server. Please try again later."
    );
  }

  const result = await readJson(response);

  if (!response.ok) {
    const error = new Error(
      result.message || `Request failed with status ${response.status}.`
    );

    error.status = response.status;
    throw error;
  }

  return result;
}

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [message, setMessage] = useState("");

  function handleApiError(error) {
    if (error.status === 401) {
      localStorage.removeItem("token");
      setToken(null);
      setClients([]);
      setProjects([]);
      setMessage("Your session has expired. Please log in again.");
      return;
    }

    setMessage(
      error.message || "Something went wrong. Please try again."
    );
  }

  async function login(event) {
    event.preventDefault();
    setMessage("");

    try {
      const result = await apiRequest("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!result.token) {
        throw new Error("The login response did not include a token.");
      }

      localStorage.setItem("token", result.token);
      setToken(result.token);
      setPassword("");
      setMessage("");
    } catch (error) {
      setMessage(
        error.message || "Unable to log in. Please try again."
      );
    }
  }

  async function loadClients() {
    try {
      const result = await apiRequest("/clients", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!Array.isArray(result.data)) {
        throw new Error("The server returned an invalid client list.");
      }

      setClients(result.data);
      return true;
    } catch (error) {
      setClients([]);
      handleApiError(error);
      return false;
    }
  }

  async function loadProjects() {
    const url = selectedClient
      ? `/projects?clientId=${encodeURIComponent(selectedClient)}`
      : "/projects";

    try {
      const result = await apiRequest(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!Array.isArray(result.projects)) {
        throw new Error("The server returned an invalid project list.");
      }

      setProjects(result.projects);
    } catch (error) {
      setProjects([]);
      handleApiError(error);
    }
  }

  async function addClient(event) {
    event.preventDefault();

    const trimmedName = clientName.trim();
    const trimmedEmail = clientEmail.trim();

    if (!trimmedName) {
      setMessage("Client name is required.");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setMessage("Please enter a valid client email.");
      return;
    }

    try {
      await apiRequest("/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail
        })
      });

      setClientName("");
      setClientEmail("");
      setMessage("Client added successfully.");

      await loadClients();
    } catch (error) {
      handleApiError(error);
    }
  }

  async function deleteClient(id) {
    try {
      const result = await apiRequest(`/clients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (String(selectedClient) === String(id)) {
        setSelectedClient("");
      }

      setMessage(
        result.message || "Client deleted successfully."
      );

      await loadClients();
    } catch (error) {
      handleApiError(error);
    }
  }

  useEffect(() => {
    if (!token) {
      setClients([]);
      return;
    }

    loadClients();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setProjects([]);
      return;
    }

    loadProjects();
  }, [token, selectedClient]);

  if (!token) {
    return (
      <div className="container">
        <div className="card">
          <h1>VIEK Client Management</h1>

          <h2>Login</h2>

          <form onSubmit={login}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Password"
              required
            />

            <button type="submit">
              Login
            </button>
          </form>

          {message && (
            <p className="message" role="alert">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>VIEK Client Management</h1>

      <div className="card">
        <h2>Add Client</h2>

        <form onSubmit={addClient}>
          <input
            value={clientName}
            onChange={(event) =>
              setClientName(event.target.value)
            }
            placeholder="Client name"
            required
          />

          <input
            type="email"
            value={clientEmail}
            onChange={(event) =>
              setClientEmail(event.target.value)
            }
            placeholder="Client email"
            required
          />

          <button type="submit">
            Add Client
          </button>
        </form>

        {message && (
          <p className="message" role="alert">
            {message}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Clients</h2>

        {clients.length === 0 ? (
          <p>No clients found.</p>
        ) : (
          <ul>
            {clients.map((client) => (
              <li key={client.id}>
                <strong>{client.name}</strong>
                <span>{client.email}</span>

                <button
                  type="button"
                  onClick={() => deleteClient(client.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Projects</h2>

        <select
          value={selectedClient}
          onChange={(event) =>
            setSelectedClient(event.target.value)
          }
        >
          <option value="">
            All Clients
          </option>

          {clients.map((client) => (
            <option
              key={client.id}
              value={client.id}
            >
              {client.name}
            </option>
          ))}
        </select>

        {projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <strong>{project.name}</strong>
                <span>
                  Client ID: {project.clientId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;