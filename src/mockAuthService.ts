// mockAuthService.ts
// Mock authentication service for development (no backend needed)

interface MockUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  user_class: string;
  user_status: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  data: MockUser;
  message: string;
}

interface ProfileResponse {
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  user_status: string;
}

// Mock users database
const MOCK_USERS: Record<string, MockUser> = {
  'admin@gmail.com': {
    id: 1,
    email: 'admin@gmail.com',
    first_name: 'Dog',
    last_name: 'Alienz',
    full_name: 'Dog Alienz',
    role: 'Admin',
    user_class: 'Envirol',
    user_status: 'ACTIVE'
  },
  'user@gmail.com': {
    id: 2,
    email: 'user@gmail.com',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    role: 'User',
    user_class: 'Envirol',
    user_status: 'ACTIVE'
  },
  'invited@gmail.com': {
    id: 3,
    email: 'invited@gmail.com',
    first_name: 'Invited',
    last_name: 'User',
    full_name: 'Invited User',
    role: 'User',
    user_class: 'Envirol',
    user_status: 'INVITED'
  }
};

// Mock session storage (simulates HttpOnly cookie on server)
class MockSessionManager {
  private readonly SESSION_KEY = 'mock_auth_session';

  setSession(email: string): void {
    // Simulate HttpOnly cookie by storing in localStorage
    // In real scenario, backend sets HttpOnly cookie
    localStorage.setItem(this.SESSION_KEY, email);
    console.log('Mock Session Created (simulating HttpOnly cookie)');
  }

  getSession(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    console.log('🔓 Mock Session Cleared');
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }
}

const sessionManager = new MockSessionManager();

// Mock API delay to simulate network
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Authentication Service
export const mockAuthService = {
  /**
   * Mock Login - Simulates backend authentication
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await delay(800); // Simulate network delay

    const { email, password } = credentials;
    const user = MOCK_USERS[email.toLowerCase()];

    // Validate credentials
    if (!user) {
      throw {
        response: {
          status: 401,
          data: { message: 'Invalid email or password' }
        }
      };
    }

    // For mock, accept any password except empty
    if (!password) {
      throw {
        response: {
          status: 401,
          data: { message: 'Password is required' }
        }
      };
    }

    // Simulate wrong password (optional: make password = "password123" for all)
    if (password !== 'password123') {
      throw {
        response: {
          status: 401,
          data: { message: 'Invalid email or password' }
        }
      };
    }

    // Set session (simulates HttpOnly cookie set by backend)
    sessionManager.setSession(email);

    console.log('Mock Login Success:', user.email);

    return {
      data: user,
      message: 'Login successful'
    };
  },

  /**
   * Mock Get Profile - Simulates fetching user profile with HttpOnly cookie
   */
  async getProfile(): Promise<ProfileResponse> {
    await delay(500);

    const sessionEmail = sessionManager.getSession();

    if (!sessionEmail) {
      throw {
        response: {
          status: 401,
          data: { message: 'Unauthorized - No active session' }
        }
      };
    }

    const user = MOCK_USERS[sessionEmail];

    if (!user) {
      sessionManager.clearSession();
      throw {
        response: {
          status: 401,
          data: { message: 'User not found' }
        }
      };
    }

    console.log('✅ Mock Profile Fetch:', user.email);

    return {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      role: user.role,
      user_status: user.user_status
    };
  },

  /**
   * Mock Logout - Simulates backend session destruction
   */
  async logout(): Promise<void> {
    await delay(300);
    sessionManager.clearSession();
    console.log('✅ Mock Logout Success');
  },

  /**
   * Check if user is authenticated (has active session)
   */
  isAuthenticated(): boolean {
    return sessionManager.isAuthenticated();
  },

  /**
   * Mock Organization Check
   */
  async checkOrganization(): Promise<{ organization_exists: boolean }> {
    await delay(300);
    return { organization_exists: true };
  },

  /**
   * Mock Password Reset
   */
  async resetPassword(data: { email: string; current_password: string; new_password: string }): Promise<void> {
    await delay(500);

    const user = MOCK_USERS[data.email];
    if (!user) {
      throw {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      };
    }

    console.log('✅ Mock Password Reset Success');
  }
};

export const __mockSessionManager = sessionManager;