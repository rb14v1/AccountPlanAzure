import api from "../api/axios";

export const authWebhook = async (username: string, password: string) => {
  try {
    const response = await api.post("/auth/login/", {
      username,
      password,
    });

    return response.data;
  } catch (error: any) {
    console.error("Login error:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post("/auth/register/", data);
    return response.data;
  } catch (error: any) {
    console.error("Register error:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

