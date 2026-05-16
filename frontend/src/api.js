const API_BASE_URL = "http://localhost:5000/api";

export async function getCities() {
  const response = await fetch(`${API_BASE_URL}/cities`);
  if (!response.ok) {
    throw new Error("Failed to fetch cities");
  }
  return response.json();
}

export async function searchFlights({ from_city, to_city, date, page = 1 }) {
  const params = new URLSearchParams();
  if (from_city) params.append("from_city", from_city);
  if (to_city) params.append("to_city", to_city);
  if (date) params.append("date", date);
  params.append("page", page);

  const response = await fetch(`${API_BASE_URL}/flights?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to search flights");
  }
  return response.json();
}

export async function getFlightById(id) {
  const response = await fetch(`${API_BASE_URL}/flights/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch flight details");
  }
  return response.json();
}

function getAuthHeaders() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    return {
      "x-user-username": user.username,
      "x-user-password": user.password,
    };
  }
  return {};
}

export async function createTicket(payload) {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create ticket");
  }

  return data;
}

export async function userLogin({ username, password }) {
  const response = await fetch(`${API_BASE_URL}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  console.log(123);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "User login failed");
  }

  return data;
}

export async function userRegister({ username, password }) {
  const response = await fetch(`${API_BASE_URL}/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "User register failed");
  }

  return data;
}

export async function getAllFlights(page = 1, query = "", includePast = false) {
  const params = new URLSearchParams();
  params.append("page", page);
  if (query) params.append("q", query);
  if (includePast) params.append("include_past", "1");
  const response = await fetch(`${API_BASE_URL}/flights?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch flights");
  }
  return response.json();
}

function adminHeaders(credentials) {
  return {
    "Content-Type": "application/json",
    "x-user-username": credentials.username,
    "x-user-password": credentials.password,
  };
}

export async function createFlightAdmin(payload, credentials) {
  const response = await fetch(`${API_BASE_URL}/flights/user`, {
    method: "POST",
    headers: adminHeaders(credentials),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create flight");
  }

  return data;
}

export async function updateFlightAdmin(id, payload, credentials) {
  const response = await fetch(`${API_BASE_URL}/flights/user/${id}`, {
    method: "PUT",
    headers: adminHeaders(credentials),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update flight");
  }

  return data;
}

export async function deleteFlightAdmin(id, credentials) {
  const response = await fetch(`${API_BASE_URL}/flights/user/${id}`, {
    method: "DELETE",
    headers: adminHeaders(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete flight");
  }

  return data;
}
export async function getUserTickets(username) {
  const response = await fetch(`${API_BASE_URL}/tickets/user/${username}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user tickets");
  }
  return response.json();
}

export async function getAllTickets() {
  const response = await fetch(`${API_BASE_URL}/tickets/all`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch all tickets");
  }
  return response.json();
}
