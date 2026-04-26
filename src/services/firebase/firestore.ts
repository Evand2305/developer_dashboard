import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './config';

export async function createUserDocument(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName ?? '',
      createdAt: serverTimestamp(),
    });
  }
}

export async function saveGitHubToken(userId: string, accessToken: string) {
  // Option A: owner-only Firestore subcollection
  // TODO: upgrade to Cloud Functions proxy (Option C) for production
  const ref = doc(db, 'users', userId, 'integrations', 'github');
  await setDoc(ref, {
    accessToken,
    connectedAt: serverTimestamp(),
  }, { merge: true });
}
