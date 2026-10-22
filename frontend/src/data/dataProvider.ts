/**
 * data/dataProvider.ts
 * Selects apiStore when signed in and API URL is available, otherwise localStore.
 */

import { DataStore } from '../types';
import { localStore } from './localStore';
import { apiStore } from './apiStore';
import { env } from '../config/env';

export interface DataContextState {
  store: DataStore;
  isBackendConnected: boolean;
}

let activeSessionUser: string | null = null;

export function setActiveUser(userId: string | null) {
  activeSessionUser = userId;
}

export function getDataStore(): DataStore {
  // If API URL is provided and user is authenticated, use apiStore
  if (!env.isDemoMode && activeSessionUser) {
    return apiStore;
  }
  return localStore;
}
