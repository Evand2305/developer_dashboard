import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  linkWithPopup,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';
import { createUserDocument, saveGitHubToken } from './firestore';

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await createUserDocument(credential.user);
  return credential.user;
}

export async function signInWithGitHub() {
  const provider = new GithubAuthProvider();
  provider.addScope('repo');
  provider.addScope('read:user');

  const result = await signInWithPopup(auth, provider);
  const credential = GithubAuthProvider.credentialFromResult(result);

  await createUserDocument(result.user);

  if (credential?.accessToken) {
    await saveGitHubToken(result.user.uid, credential.accessToken);
  }

  return result.user;
}

// Used by the GitHub widget to connect/reconnect GitHub for any auth method.
// Tries linkWithPopup first (email users), falls back to signInWithPopup
// (users who already signed in with GitHub and need a fresh token).
export async function connectGitHubToken(uid: string): Promise<void> {
  const provider = new GithubAuthProvider();
  provider.addScope('repo');
  provider.addScope('read:user');

  let accessToken: string | undefined;

  try {
    const result = await linkWithPopup(auth.currentUser!, provider);
    accessToken = GithubAuthProvider.credentialFromResult(result)?.accessToken;
  } catch {
    // Provider already linked — re-auth to get a fresh token
    const result = await signInWithPopup(auth, provider);
    accessToken = GithubAuthProvider.credentialFromResult(result)?.accessToken;
  }

  if (accessToken) {
    await saveGitHubToken(uid, accessToken);
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}
