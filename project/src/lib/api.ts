// API client for backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to set auth token in localStorage
export const setToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
    }
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  signup: async (email: string, password: string, userData: any = {}) => {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        ...userData,
      }),
    });
    
    if (response.token) {
      setToken(response.token);
    }
    
    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      setToken(response.token);
    }
    
    return response;
  },

  getCurrentUser: async () => {
    const response = await apiRequest('/auth/me', {
      method: 'GET',
    });
    return response.user;
  },

  logout: () => {
    setToken(null);
  },
};

// User Profile API
export const profileAPI = {
  getProfile: async () => {
    const response = await apiRequest('/auth/profile', {
      method: 'GET',
    });
    return response.profile;
  },

  updateProfile: async (profileData: any) => {
    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.profile;
  },
};

// Reservation API
export const reservationAPI = {
  // Get all table types (public)
  getTableTypes: async () => {
    const response = await apiRequest('/reservations/table-types', {
      method: 'GET',
    });
    return response.tableTypes;
  },

  // Create a new reservation
  createReservation: async (reservationData: {
    table_type: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    num_people: number;
  }) => {
    const response = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData),
    });
    return response.reservation;
  },

  // Get all reservations for the current user
  getMyReservations: async () => {
    const response = await apiRequest('/reservations/my-reservations', {
      method: 'GET',
    });
    return response.reservations;
  },

  // Get a single reservation by ID
  getReservationById: async (id: string | number) => {
    const response = await apiRequest(`/reservations/${id}`, {
      method: 'GET',
    });
    return response.reservation;
  },

  // Update a reservation
  updateReservation: async (id: string | number, reservationData: {
    table_type?: string;
    reservation_date?: string;
    start_time?: string;
    end_time?: string;
    num_people?: number;
    status?: string;
  }) => {
    const response = await apiRequest(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reservationData),
    });
    return response.reservation;
  },

  // Confirm a reservation
  confirmReservation: async (id: string | number) => {
    const response = await apiRequest(`/reservations/${id}/confirm`, {
      method: 'POST',
    });
    return response.reservation;
  },

  // Cancel a reservation
  cancelReservation: async (id: string | number) => {
    const response = await apiRequest(`/reservations/${id}/cancel`, {
      method: 'POST',
    });
    return response.reservation;
  },

  // Delete a reservation (alternative cancel method)
  deleteReservation: async (id: string | number) => {
    const response = await apiRequest(`/reservations/${id}`, {
      method: 'DELETE',
    });
    return response.reservation;
  },

  // Get all reservations (admin only)
  getAllReservations: async () => {
    const response = await apiRequest('/reservations/admin/all', {
      method: 'GET',
    });
    // Handle both response formats: { reservations: [...] } or just [...]
    return response.reservations || response || [];
  },
};

// Contact Message API
export const contactMessageAPI = {
  // Send a contact message (public)
  sendMessage: async (messageData: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }) => {
    const response = await apiRequest('/contact-messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    return response.contactMessage;
  },

  // Get all messages (admin only)
  getAllMessages: async () => {
    const response = await apiRequest('/contact-messages/admin/all', {
      method: 'GET',
    });
    return response.messages || [];
  },

  // Update message status (admin only)
  updateMessageStatus: async (id: string | number, status: 'new' | 'read' | 'replied' | 'archived') => {
    const response = await apiRequest(`/contact-messages/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.contactMessage;
  },

  // Delete a message (admin only)
  deleteMessage: async (id: string | number) => {
    const response = await apiRequest(`/contact-messages/admin/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
};

const SERVER_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '') || 'http://localhost:3001';

export function getUploadsBaseUrl(): string {
  return SERVER_BASE;
}

// Food items (menu) API
export const foodAPI = {
  getFoodItems: async () => {
    const response = await apiRequest('/food-items', { method: 'GET' });
    return response.foodItems || [];
  },

  getAllAdmin: async () => {
    const response = await apiRequest('/food-items/admin/all', { method: 'GET' });
    return response.foodItems || [];
  },

  createFoodItem: async (formData: FormData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/food-items`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await res.json() : {};
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data.foodItem;
  },

  updateFoodItem: async (id: string, formData: FormData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/food-items/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await res.json() : {};
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data.foodItem;
  },

  deleteFoodItem: async (id: string) => {
    await apiRequest(`/food-items/${id}`, { method: 'DELETE' });
  },
};

// Orders API
export const ordersAPI = {
  createOrder: async (payload: {
    order_type: 'enligne' | 'sur_place';
    reservation_id?: string;
    delivery_address?: string;
    items: { food_item_id: string; quantity: number; unit_price: number }[];
  }) => {
    const response = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.order;
  },
};

export default apiRequest;
