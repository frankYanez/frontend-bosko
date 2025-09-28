import axios from 'axios';

/**
 * Authentication related API calls.
 *
 * These functions wrap the raw HTTP requests to the backend endpoints
 * responsible for user authentication. Keeping them here decouples
 * network logic from the rest of the application and makes it easy to
 * swap implementations or update endpoints in one place.
 */

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends Credentials {
  name: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

/**
 * login
 *
 * POST `/auth/login`
 *
 * @param credentials - email and password
 * @returns AuthResponse containing user and JWT token
 */
export async function login(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>('/auth/login', credentials);
  return data;
}

/**
 * register
 *
 * POST `/auth/register`
 *
 * @param payload - name, email and password
 * @returns AuthResponse containing user and JWT token
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>('/auth/register', payload);
  return data;
}

/**
 * fetchProfile
 *
 * GET `/auth/profile`
 *
 * Fetch the current authenticated user's profile using the token
 * stored in localStorage or added via the interceptor in client.ts.
 */
export async function fetchProfile(): Promise<any> {
  const { data } = await axios.get('/auth/profile');
  return data;
}

/**
 * refreshToken
 *
 * POST `/auth/refresh`
 *
 * Requests a new token. Some backends issue short-lived tokens that
 * require a refresh. This call should be invoked when you detect
 * your token is about to expire.
 */
export async function refreshToken(): Promise<{ token: string }> {
  const { data } = await axios.post('/auth/refresh');
  return data;
}