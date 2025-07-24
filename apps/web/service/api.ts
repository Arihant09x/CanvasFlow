import axios from "axios";
const BASE_URL = "http://canvasflow.devvault.site/api/v1";
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Set the authorization token for subsequent requests
 * @param token JWT token string
 */
if (!BASE_URL) {
  console.error("API Base URL is not set");
}
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common["authorization"] = ` ${token}`;
  } else {
    delete apiClient.defaults.headers.common["authorization"];
  }
}

/**
 * Get welcome message from backend
 */
export async function getWelcomeMessage() {
  const response = await apiClient.get("/");
  return response.data;
}

/**
 * Signup user
 * @param userData { email, firstname, lastname, password, photo }
 */
export async function signupUser(userData: {
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  photo?: string;
}) {
  const response = await apiClient.post("/signup", userData);
  return response.data;
}

/**
 * Signin user
 * @param credentials { email, password }
 */
export async function signinUser(credentials: {
  email: string;
  password: string;
}) {
  const response = await apiClient.post("/signin", credentials);
  return response.data;
}

/**
 * Create a room
 * @param slug string room slug
 */
export async function createRoom(slug: string, token: string) {
  const response = await apiClient.post(
    "/room-id",
    { slug },
    {
      headers: {
        Authorization: `${token}`,
      },
    }
  );
  return response.data;
}

/**
 * Get chats for a room
 * @param roomId number room id
 */
export async function getChats(roomId: string, token: string) {
  const response = await apiClient.get(`/chats/${roomId}`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  return response.data;
}

/**
 * Get room info by slug
 * @param slug string room slug
 */
export async function getRoomInfo(slug: string, token: string) {
  const response = await apiClient.get(`/room/${slug}`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  return response.data;
}

export async function getRoom(token: string) {
  const response = await apiClient.get(`/rooms`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  return response.data;
}

export async function getMyRooms(token: string) {
  const response = await apiClient.get(`/my-rooms`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  return response.data;
}

export async function deleteRoom(roomId: number, token: string) {
  const response = await apiClient.delete(`/room/${roomId}`, {
    headers: {
      Authorization: `${token}`,
    },
  });
  return response.data;
}
/**
 * Get user info by token
 * @param token string JWT token
 */
export async function getUserInfo(token: string) {
  const response = await apiClient.get("/user", {
    headers: {
      Authorization: `${token}`,
    },
  });
  return response.data;
}
