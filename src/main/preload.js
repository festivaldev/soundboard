const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	fileEncoder: {
		getEncodedFile: async (params) => await ipcRenderer.invoke("getBase64EncodedFile", params)
	},
	dialog: {
		open: async (params, callback) => callback(await ipcRenderer.invoke('dialog', params)),
		prompt: async (params) => await ipcRenderer.invoke("prompt", params)
	},
	storage: {
		get: async (key) => await ipcRenderer.invoke("getUserData", key),
		set: async (key, value) => await ipcRenderer.invoke("setUserData", key, value),
		has: async (key) => await ipcRenderer.invoke("hasUserData", key),
		delete: async (key) => await ipcRenderer.invoke("deleteUserData", key),
	},
	remoteControl: {
		isEnabled: async () => await ipcRenderer.invoke("getRemoteControlEnabled"),
		setEnabled: async (enabled) => await ipcRenderer.invoke("setRemoteControlEnabled", enabled),
		getIP: async () => await ipcRenderer.invoke("getRemoteControlIP"),
		getPort: async () => await ipcRenderer.invoke("getRemoteControlPort"),
	}
});