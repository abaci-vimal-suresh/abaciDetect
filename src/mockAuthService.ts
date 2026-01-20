// mockAuthService.ts
// Mock authentication service for development (no backend needed)

interface MockUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  user: MockUser;
  message: string;
}

interface ProfileResponse {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

// Mock users database
const MOCK_USERS: Record<string, MockUser> = {
  'john_admin': {
    id: 1,
    username: 'john_admin',
    email: 'admin@gmail.com',
    first_name: 'Arun',
    last_name: '',
    role: 'Admin',
    is_active: true
  },
  'vimal_viewer': {
    id: 2,
    username: 'vimal_viewer',
    email: 'viewer@gmail.com',
    first_name: 'Vimal',
    last_name: '',
    role: 'Viewer',
    is_active: true
  },
  'gold_viewer': {
    id: 3,
    username: 'gold_viewer',
    email: 'gold@gmail.com',
    first_name: 'Gold',
    last_name: 'Smith',
    role: 'Viewer',
    is_active: true
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

    const { username, password } = credentials;
    const user = MOCK_USERS[username];

    // Validate credentials
    if (!user) {
      throw {
        response: {
          status: 401,
          data: { message: 'Invalid username or password' }
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

    // Simulate wrong password
    if (password !== 'password123') {
      throw {
        response: {
          status: 401,
          data: { message: 'Invalid username or password' }
        }
      };
    }

    // Set session
    sessionManager.setSession(username);

    console.log('Mock Login Success:', user.username);

    return {
      user: user,
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
      role: user.role
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