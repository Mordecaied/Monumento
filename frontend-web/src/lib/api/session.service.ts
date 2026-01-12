/**
 * Session Service
 * Handles podcast session and message management
 */

import { apiClient } from './client';

export interface SessionMetadata {
  topics?: string[];
  context?: string;
  photos?: string[];
  [key: string]: any;
}

export interface SessionRequest {
  vibe: string;
  mode: string;
  durationMinutes?: number;
  videoUrl?: string;
  metadata?: SessionMetadata;
}

export interface Session {
  id: string;
  userId: string;
  vibe: string;
  mode: string;
  durationMinutes?: number;
  videoUrl?: string;
  summary?: string;
  summaryGeneratedAt?: string;
  metadata?: SessionMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRequest {
  role: 'user' | 'ai';
  text: string;
  relativeOffset?: number;
  audioUrl?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  relativeOffset: number;
  audioUrl?: string;
  metadata?: {
    animatedVideoUrl?: string;
    [key: string]: any;
  };
}

export interface PagedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
}

/**
 * Create a new session
 */
export async function createSession(request: SessionRequest): Promise<Session> {
  return apiClient.post<Session>('/sessions', request, true);
}

/**
 * Get a specific session by ID
 */
export async function getSession(sessionId: string): Promise<Session> {
  return apiClient.get<Session>(`/sessions/${sessionId}`, true);
}

/**
 * Get user's sessions with pagination
 */
export async function getUserSessions(
  page = 0,
  size = 10
): Promise<PagedResponse<Session>> {
  return apiClient.get<PagedResponse<Session>>(
    `/sessions?page=${page}&size=${size}`,
    true
  );
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  request: Partial<SessionRequest>
): Promise<Session> {
  return apiClient.put<Session>(`/sessions/${sessionId}`, request, true);
}

/**
 * Update session metadata (merges with existing metadata)
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: SessionMetadata
): Promise<Session> {
  return apiClient.patch<Session>(`/sessions/${sessionId}/metadata`, metadata, true);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  return apiClient.delete<void>(`/sessions/${sessionId}`, true);
}

/**
 * Post a message to a session
 */
export async function postMessage(
  sessionId: string,
  request: MessageRequest
): Promise<Message> {
  return apiClient.post<Message>(
    `/sessions/${sessionId}/messages`,
    request,
    true
  );
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  return apiClient.get<Message[]>(`/sessions/${sessionId}/messages`, true);
}

/**
 * Get paginated messages for a session
 */
export async function getSessionMessagesPaged(
  sessionId: string,
  page = 0,
  size = 50
): Promise<PagedResponse<Message>> {
  return apiClient.get<PagedResponse<Message>>(
    `/sessions/${sessionId}/messages?paged=true&page=${page}&size=${size}`,
    true
  );
}

/**
 * Delete a message
 */
export async function deleteMessage(
  sessionId: string,
  messageId: string
): Promise<void> {
  return apiClient.delete<void>(
    `/sessions/${sessionId}/messages/${messageId}`,
    true
  );
}

/**
 * Generate AI summary for a session
 */
export async function generateSessionSummary(sessionId: string): Promise<{ summary: string; message: string }> {
  return apiClient.post<{ summary: string; message: string }>(
    `/sessions/${sessionId}/generate-summary`,
    {},
    true
  );
}

/**
 * Generate animated avatars for a session
 */
export async function generateAnimatedAvatars(sessionId: string, avatarImageUrl: string): Promise<{ message: string; status: string }> {
  return apiClient.post<{ message: string; status: string }>(
    `/sessions/${sessionId}/generate-avatars?avatarImageUrl=${encodeURIComponent(avatarImageUrl)}`,
    {},
    true
  );
}

/**
 * Upload audio file and return URL
 */
export async function uploadAudio(file: Blob, sessionId: string, messageId: string): Promise<string> {
  const formData = new FormData();
  formData.append('audio', file, `${sessionId}_${messageId}.webm`);

  // For now, return a local URL - in production this would upload to S3/R2
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Store as data URL temporarily - will be replaced with cloud storage
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Update message with audio URL
 */
export async function updateMessageAudio(sessionId: string, messageId: string, audioUrl: string): Promise<Message> {
  return apiClient.put<Message>(
    `/sessions/${sessionId}/messages/${messageId}`,
    { audioUrl },
    true
  );
}

export const sessionService = {
  createSession,
  getSession,
  getUserSessions,
  updateSession,
  updateSessionMetadata,
  deleteSession,
  postMessage,
  getSessionMessages,
  getSessionMessagesPaged,
  deleteMessage,
  generateSessionSummary,
  generateAnimatedAvatars,
};

export default sessionService;
