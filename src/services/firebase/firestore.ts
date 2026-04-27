// Direct Firestore write helpers used by auth and widget services.
// All data lives under users/{uid}/... so security rules enforce ownership.
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './config';

// Creates the user's top-level profile document on first sign-in.
// Skips silently if the document already exists (idempotent).
export async function createUserDocument(user: User) {
  const userRef  = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email:       user.email,
      displayName: user.displayName ?? '',
      createdAt:   serverTimestamp(),
    });
  }
}

// Saves the GitHub OAuth access token under the user's private integrations subcollection.
// Option A storage: protected by Firestore rules. For production, migrate to a
// Cloud Functions proxy so the token never reaches the client.
export async function saveGitHubToken(userId: string, accessToken: string) {
  const ref = doc(db, 'users', userId, 'integrations', 'github');
  await setDoc(ref, { accessToken, connectedAt: serverTimestamp() }, { merge: true });
}
