import { contextBridge, ipcRenderer } from 'electron'

// Every call the interface is permitted to make. Nothing outside this
// object is reachable from the renderer. Grow it as handlers are added.
const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('health:ping')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api