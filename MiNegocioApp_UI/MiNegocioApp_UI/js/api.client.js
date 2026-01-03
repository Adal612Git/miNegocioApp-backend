class ApiClient {
  constructor(baseUrl) {
    this.baseUrl =
      baseUrl || window.API_BASE_URL || "https://api.lotosproductions.com/api";
  }

  getToken() {
    return localStorage.getItem("token");
  }

  async request(path, options) {
    const headers = new Headers(options?.headers || {});
    headers.set("Content-Type", "application/json");

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return null;
    }

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const error = new Error(data?.message || "REQUEST_FAILED");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(path) {
    return this.request(path, { method: "GET" });
  }

  post(path, body) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body || {}),
    });
  }

  patch(path, body) {
    return this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body || {}),
    });
  }

  delete(path) {
    return this.request(path, { method: "DELETE" });
  }
}

window.ApiClient = ApiClient;
