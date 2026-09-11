import { contextBridge, ipcRenderer } from 'electron'
import type { RegistrationInput, SessionStatus, StartupState } from '../shared/auth'
import type { PatientInput, PatientRecord } from '@shared/patient'
import type { SessionFilters, SessionInput, SessionRecord } from '../shared/session'
import type { Program } from '@shared/program'
import type { TrendPoint, TrendQuery } from '@shared/report'


/**
 * Every call the interface is permitted to make. Nothing outside this
 * object is reachable from the renderer.
 *
 * The database encryption key is deliberately absent. It exists only in
 * main-process memory and never crosses this boundary.
 */
const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('health:ping'),

  auth: {
    startupState: (): Promise<StartupState> => ipcRenderer.invoke('auth:startupState'),

    createUser: (input: RegistrationInput): Promise<{ recoveryKey: string }> =>
      ipcRenderer.invoke('auth:createUser', input),

    login: (username: string, password: string): Promise<{ ok: true }> =>
      ipcRenderer.invoke('auth:login', { username, password }),

    logout: (): Promise<{ ok: true }> => ipcRenderer.invoke('auth:logout'),

    sessionStatus: (): Promise<SessionStatus> => ipcRenderer.invoke('auth:sessionStatus'),

    resetPassword: (recoveryKey: string, newPassword: string): Promise<{ ok: true }> =>
      ipcRenderer.invoke('auth:resetPassword', recoveryKey, newPassword),

    profile: (): Promise<{ firstName: string; lastName: string; email: string } | null> =>
      ipcRenderer.invoke('auth:profile'),

    /** Fires when the twelve-hour session expires. Returns an unsubscribe function. */
    onSessionExpired: (handler: () => void): (() => void) => {
      const listener = (): void => handler()
      ipcRenderer.on('auth:sessionExpired', listener)
      return () => ipcRenderer.removeListener('auth:sessionExpired', listener)
    }
  },
  
  patients: {
    list: (): Promise<PatientRecord[]> => ipcRenderer.invoke('patients:list'),

    listActive: (): Promise<PatientRecord[]> => ipcRenderer.invoke('patients:listActive'),

    get: (id: number): Promise<PatientRecord | null> =>
      ipcRenderer.invoke('patients:get', id),

    create: (input: PatientInput): Promise<PatientRecord> =>
      ipcRenderer.invoke('patients:create', input),

    update: (id: number, input: PatientInput): Promise<PatientRecord> =>
      ipcRenderer.invoke('patients:update', id, input),

    remove: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('patients:delete', id)
  },

  sessions: {
    list: (filters?: SessionFilters): Promise<SessionRecord[]> =>
      ipcRenderer.invoke('sessions:list', filters ?? {}),

    get: (id: number): Promise<SessionRecord | null> =>
      ipcRenderer.invoke('sessions:get', id),

    create: (input: SessionInput): Promise<SessionRecord> =>
      ipcRenderer.invoke('sessions:create', input),

    update: (id: number, input: SessionInput): Promise<SessionRecord> =>
      ipcRenderer.invoke('sessions:update', id, input),

    remove: (id: number): Promise<{ ok: true }> => ipcRenderer.invoke('sessions:delete', id)
  },

  programs: {
    list: (): Promise<Program[]> => ipcRenderer.invoke('programs:list')
  },

  reports: {
    trends: (query: TrendQuery): Promise<TrendPoint[]> =>
      ipcRenderer.invoke('reports:trends', query),

    exportPdf: (
      html: string,
      suggestedName: string
    ): Promise<{ ok: boolean; filePath?: string }> =>
      ipcRenderer.invoke('reports:exportPdf', html, suggestedName)
  }

}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
