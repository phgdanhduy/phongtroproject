const BASE_URL = "/api";

export interface User {
  id: number;
  email: string;
  fullName: string;
  studentId: string;
  hasProfile?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const authApi = {
  async register(data: { email: string; password: string; fullName: string; studentId: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getToken(): string | null {
    return localStorage.getItem("vnu_token");
  },

  setSession(token: string, user: User) {
    localStorage.setItem("vnu_token", token);
    localStorage.setItem("vnu_user", JSON.stringify(user));
  },

  getUser(): User | null {
    const raw = localStorage.getItem("vnu_user");
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem("vnu_token");
    localStorage.removeItem("vnu_user");
  },
};

export const roommateApi = {
  async getRoommates(params?: {
    campus?: string;
    budgetMax?: number;
    cleanlinessMin?: number;
    sleepSchedule?: string;
    noiseLevel?: string;
  }): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.campus && params.campus !== "ALL") query.append("campus", params.campus);
    if (params?.budgetMax) query.append("budgetMax", params.budgetMax.toString());
    if (params?.cleanlinessMin) query.append("cleanlinessMin", params.cleanlinessMin.toString());
    if (params?.sleepSchedule) query.append("sleepSchedule", params.sleepSchedule);
    if (params?.noiseLevel) query.append("noiseLevel", params.noiseLevel);

    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/roommates?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.json();
  },
};

export const userApi = {
  async getMe(): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateProfile(data: any): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

export const roomApi = {
  async getMyRoom(): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/rooms/my-room`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async createRoom(data: { name: string; campus: string; addressOrBlock?: string }): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async addMember(roomId: number, email: string): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentEmail: email }),
    });
    return res.json();
  },
};

export const expenseApi = {
  async getExpenses(roomId: number): Promise<ApiResponse<any[]>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async createExpense(
    roomId: number,
    data: { title: string; amount: number; category: string; splitWith?: number[] }
  ): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getBalances(roomId: number): Promise<ApiResponse<any>> {
    const token = authApi.getToken();
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/balances`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};
