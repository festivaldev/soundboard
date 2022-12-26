const chalk = require("chalk"),
	  express = require("express"),
	  fileType = require("file-type"),
	  fs = require("fs"),
	  ip = require("ip"),
	  path = require("path"),
	  Store = require("electron-store"),
	{ app, dialog, BrowserWindow, ipcMain } = require('electron'),
	{ v4: uuid } = require("uuid");

let mainWindow;

let master = null;
const clients = {};
const store = new Store();

let socketListener;

app.setAboutPanelOptions({
	applicationName: "FSVL Soundboard",
	applicationVersion: "1.0",
	version: "1",
	copyright: "Copyright © 2022 Team FESTIVAL. All rights reserved."
});

function createWindow() {
	mainWindow = new BrowserWindow({
		title: "FSVL Soundboard",
		width: 800,
		height: 780,
		autoHideMenuBar: true,
		// experimentalFeatures: true,
		// enableRemoteModule: true,
		// nodeIntegration: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			devTools: !app.isPackaged,
			webSecurity: app.isPackaged
		}
	});

	// if (process.env.NODE_ENV !== 'production' && !app.isPackaged) {
	// 	mainWindow.loadURL(`http://localhost:8080`);
	// 	// mainWindow.webContents.openDevTools()
	// } else {
	// 	mainWindow.loadFile("./dist/index.html");
	// }

	mainWindow.loadFile("./dist/index.html");
	mainWindow.webContents.openDevTools()
}

function createSocketListener(port) {
	return new Promise((resolve, reject) => {
		const expressApp = express();
		require('express-ws')(expressApp, null, {
			wsOptions: {
				perMessageDeflate: {
					zlibDeflateOptions: {
						chunkSize: 1024,
						memLevel: 7,
						level: 3
					},
					zlibInflateOptions: {
						chunkSize: 10 * 1024
					},
					clientNoContextTakeover: true,
					serverNoContextTakeover: true,
					serverMaxWindowBits: 10,
					concurrencyLimit: 10,
					threshold: 1024
				}
			}
		});

		expressApp.use("/", express.static(path.join(__dirname, '../../', 'dist')));

		expressApp.ws('/master', function(ws, req) {
			if (!master) {
				master = ws;
				console.log("master connected");
			} else {
				ws.close();
			}

			ws.on('message', function(msg) {
				let data = JSON.parse(msg);

				if (data._clientId) {
					clients[data._clientId].send(msg);
				} else {
					Object.values(clients).forEach(_ => _.send(msg));
				}
			});

			ws.on('close', () => {
				if (master === ws) {
					master = null;
					console.log("master disconnected")
				}
			});
		});

		expressApp.ws('/client', function(ws, req) {
			let clientId = uuid();
			console.log("client connected", clientId);
			clients[clientId] = ws;

			ws.send(JSON.stringify({ type: "favorites", favorites: store.get("favorites") ?? [] }));
			ws.send(JSON.stringify({ type: "sections", sections: store.get("sections") ?? [] }));

			master.send(JSON.stringify({ type: "clientConnected", clientId }));

			ws.on('message', async function(msg) {
				let data = JSON.parse(msg);

				if (master) {
					let key = Object.keys(clients).find(key => clients[key] === ws);

					master.send(msg);

					Object.entries(clients)
						.filter(([_key, _value]) => _key !== key)
						.map(([_key, _value]) => _value)
						.forEach(_ => _.send(JSON.stringify({
							...data,
							isClient: undefined,
							isMaster: true
						})));
				}
			});

			ws.on('close', () => {
				let key = Object.keys(clients).find(key => clients[key] === ws);

				if (key) {
					delete clients[key];
					console.log("client disconnected")
				}
			});
		});

		console.log(port)
		socketListener = expressApp.listen(port ?? 0, () => {
			// store.set("remotePort", listener.address().port);
			console.log(`[${chalk.blue("INFO")}] Server is running on port ${socketListener.address().port}!`);
			resolve();
		});
	});
}

async function getBase64EncodedFile(filePath) {
	let buffer = fs.readFileSync(filePath);
	let mimeData = await fileType.fromBuffer(buffer);

	return `data:${mimeData.mime};base64,${buffer.toString("base64")}`
}

app.whenReady().then(() => {
	if (store.get("remoteControlEnabled")) {
		createSocketListener(app.isPackaged ? null : 8081);
	}

	createWindow();

	app.on('activate', function() {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	});

	ipcMain.handle("getUserData", (_, key) => {
		return store.get(key);
	});

	ipcMain.handle("setUserData", (_, key, value) => {
		store.set(key, value)
	});

	ipcMain.handle("hasUserData", (_, key) => {
		return store.has(key);
	});

	ipcMain.handle("deleteUserData", (_, key) => {
		return store.delete(key);
	});

	ipcMain.handle("dialog", async (_, params) => {
		return await dialog.showOpenDialog(params);
	});



	ipcMain.handle("getBase64EncodedFile", async (_, params) => {
		return await getBase64EncodedFile(params.file);
	});



	ipcMain.handle("getRemoteControlEnabled", async () => {
		return store.get("remoteControlEnabled") || false;
	});

	ipcMain.handle("setRemoteControlEnabled", async (_, enabled) => {
		store.set("remoteControlEnabled", enabled);

		if (enabled && !socketListener) {
			return await createSocketListener();
		} else if (!enabled && socketListener) {
			socketListener.close(() => {
				console.log(`[${chalk.blue("INFO")}] Server closed`);
			});
			socketListener = null;
		}
	});

	ipcMain.handle('getRemoteControlIP', async (_, params) => {
		return ip.address();
	});

	ipcMain.handle('getRemoteControlPort', async (_, params) => {
		return socketListener.address().port;
	});
})

app.on('window-all-closed', function() {
	// if (process.platform !== 'darwin') app.quit()
	app.quit();
});