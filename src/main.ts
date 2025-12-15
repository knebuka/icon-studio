import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";

let mainWindow: BrowserWindow | null = null;
let isAdmin = true; // 開発中は常にtrue

// Check if running as administrator
function checkIsAdmin(): Promise<boolean> {
	// 開発中は常にtrueを返す
	return Promise.resolve(true);

	/* 本番環境用のコード（後で有効化）
	return new Promise((resolve) => {
		if (process.platform === "win32") {
			exec("net session", (error) => {
				resolve(!error);
			});
		} else {
			// For Linux/Mac, check if user is root
			resolve(process.getuid && process.getuid() === 0);
		}
	});
	*/
}

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1400,
		height: 900,
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
		},
		frame: false,
		titleBarStyle: "hidden",
		backgroundColor: "#1e1e1e",
		icon: path.join(__dirname, "../assets/icon.png"),
	});

	// Load the index.html
	mainWindow.loadFile(path.join(__dirname, "index.html"));

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

// Setup IPC handlers for window controls
ipcMain.on("window-minimize", () => {
	if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
	if (mainWindow) {
		if (mainWindow.isMaximized()) {
			mainWindow.unmaximize();
		} else {
			mainWindow.maximize();
		}
	}
});

ipcMain.on("window-close", () => {
	if (mainWindow) mainWindow.close();
});

// Check admin status
ipcMain.handle("is-admin", async () => {
	return isAdmin;
});

// Send log to renderer
function sendLog(level: "info" | "debug" | "warn" | "error" | "fatal", message: string) {
	if (mainWindow && isAdmin) {
		mainWindow.webContents.send("debug-log", { level, message, timestamp: new Date().toISOString() });
	}
}

// Expose log function for search and other operations
ipcMain.on("send-log", (event, level: string, message: string) => {
	sendLog(level as any, message);
});

// Search functionality in main process
ipcMain.handle("search-files", async (event, searchPath: string, query: string) => {
	return new Promise((resolve) => {
		const results: Array<{ file: string; line: number; content: string }> = [];
		const MAX_RESULTS = 200; // 結果の上限
		const MAX_FILES = 5000; // 検索するファイル数の上限

		let filesSearched = 0;

		const searchInDirectory = (dirPath: string): void => {
			if (results.length >= MAX_RESULTS || filesSearched >= MAX_FILES) {
				return;
			}

			try {
				if (!fs.existsSync(dirPath)) {
					return;
				}

				// 検索中のディレクトリをデバッグログに出力
				sendLog("debug", `Searching in: ${dirPath}`);

				const items = fs.readdirSync(dirPath);

				for (const item of items) {
					if (results.length >= MAX_RESULTS || filesSearched >= MAX_FILES) break;

					// Skip hidden files and common directories
					if (item.startsWith(".") || ["node_modules", "dist", "build"].includes(item)) {
						continue;
					}

					const fullPath = path.join(dirPath, item);
					try {
						const stats = fs.statSync(fullPath);

						if (stats.isDirectory()) {
							searchInDirectory(fullPath);
						} else {
							filesSearched++;

							// ファイル名で検索（大文字小文字を区別しない）
							const fileName = path.basename(fullPath);
							if (fileName.toLowerCase().includes(query.toLowerCase())) {
								results.push({
									file: fullPath,
									line: 0,
									content: fileName,
								});
							}
						}
					} catch (err) {
						// Skip files we can't access
					}
				}
			} catch (err) {
				console.error("Search error:", err);
			}
		};

		// Run search in next tick to not block
		setImmediate(() => {
			try {
				sendLog("debug", `Starting search for "${query}" in ${searchPath}`);
				searchInDirectory(searchPath);
				sendLog("debug", `Search completed. Found ${results.length} results.`);
				resolve(results);
			} catch (error) {
				console.error("Search failed:", error);
				sendLog("error", `Search failed: ${error}`);
				resolve([]);
			}
		});
	});
});

app.on("ready", async () => {
	isAdmin = await checkIsAdmin();
	console.log("Running as admin:", isAdmin);
	createWindow();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});
