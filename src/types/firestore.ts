import type { Timestamp } from 'firebase/firestore';
import type { WidgetType } from './widget';

export interface FirestoreUser {
  email: string;
  displayName: string;
  createdAt: Timestamp;
}

export interface FirestoreWidget {
  type: WidgetType;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreNote {
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreGitHubIntegration {
  // Option A: stored in owner-only Firestore subcollection
  // TODO: migrate to Cloud Functions proxy (Option C) for production
  accessToken: string;
  scopes: string[];
  connectedAt: Timestamp;
}
