// All Firebase Authentication operations: sign-in, registration, OAuth flows,
// and sign-out. Widget-level token connections (GitHub) live here too.
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

// Standard email/password sign-in.
export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// Registers a new user, sets their display name, and creates their Firestore profile.
export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await createUserDocument(credential.user);
  return credential.user;
}

// Signs in with GitHub OAuth (used on the login page).
// Saves the GitHub access token so the GitHub widget can call the API.
export async function signInWithGitHub() {
  const provider = new GithubAuthProvider();
  provider.addScope('repo');
  provider.addScope('read:user');

  const result     = await signInWithPopup(auth, provider);
  const credential = GithubAuthProvider.credentialFromResult(result);

  await createUserDocument(result.user);
  if (credential?.accessToken) await saveGitHubToken(result.user.uid, credential.accessToken);

  return result.user;
}

// Used by the GitHub widget to connect/reconnect at any time, regardless of
// how the user originally signed in. linkWithPopup handles email users;
// the catch handles users who are already linked and need a fresh token.
export async function connectGitHubToken(uid: string): Promise<void> {
  const provider = new GithubAuthProvider();
  provider.addScope('repo');
  provider.addScope('read:user');

  let accessToken: string | undefined;
  try {
    const result = await linkWithPopup(auth.currentUser!, provider);
    accessToken = GithubAuthProvider.credentialFromResult(result)?.accessToken;
  } catch {
    const result = await signInWithPopup(auth, provider);
    accessToken = GithubAuthProvider.credentialFromResult(result)?.accessToken;
  }

  if (accessToken) await saveGitHubToken(uid, accessToken);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
