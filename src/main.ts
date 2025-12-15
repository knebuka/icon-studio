import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
import { exec } from "child_process";

let mainWindow: BrowserWindow | null = null;
let isAdmin = true; // 開発中は常にtrue

// Midjourney client (lazy initialization)
let midjourneyClient: any = null;

async function initializeMidjourney() {
	if (midjourneyClient) return midjourneyClient;

	try {
		const { Midjourney } = require("midjourney");

		// Load environment variables from .env file if it exists
		const envPath = path.join(__dirname, "../.env");
		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, "utf-8");
			envContent.split("\n").forEach((line) => {
				const match = line.match(/^([^=]+)=(.*)$/);
				if (match) {
					process.env[match[1].trim()] = match[2].trim();
				}
			});
		}

		const serverId = process.env.DISCORD_SERVER_ID || "";
		const channelId = process.env.DISCORD_CHANNEL_ID || "";
		const salaiToken = process.env.DISCORD_BOT_TOKEN || "";

		if (!serverId || !channelId || !salaiToken) {
			sendLog("error", "Midjourney configuration missing. Please set DISCORD_SERVER_ID, DISCORD_CHANNEL_ID, and DISCORD_BOT_TOKEN in .env file");
			return null;
		}

		midjourneyClient = new Midjourney({
			ServerId: serverId,
			ChannelId: channelId,
			SalaiToken: salaiToken,
			Debug: true,
			Ws: true,
		});

		sendLog("info", "Midjourney client initialized");
		return midjourneyClient;
	} catch (error: any) {
		sendLog("error", `Failed to initialize Midjourney: ${error.message}`);
		return null;
	}
}

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

// Midjourney image generation
ipcMain.handle("midjourney-generate", async (event, prompt: string, params: any) => {
	try {
		sendLog("info", `Starting Midjourney generation: ${prompt}`);

		const client = await initializeMidjourney();
		if (!client) {
			return { success: false, error: "Midjourney client not initialized" };
		}

		// Build the full prompt with parameters
		let fullPrompt = prompt;
		if (params.aspectRatio && params.aspectRatio !== "1:1") {
			fullPrompt += ` --ar ${params.aspectRatio}`;
		}
		if (params.model) {
			fullPrompt += ` --v ${params.model}`;
		}

		sendLog("debug", `Full prompt: ${fullPrompt}`);

		// Send to Midjourney
		const result = await client.Imagine(fullPrompt, (uri: string, progress: string) => {
			// Progress callback
			sendLog("debug", `Generation progress: ${progress}`);
			if (mainWindow) {
				mainWindow.webContents.send("midjourney-progress", { uri, progress });
			}
		});

		if (result) {
			sendLog("info", `Generation completed successfully`);
			return {
				success: true,
				imageUrl: result.uri,
				id: result.id,
				hash: result.hash,
			};
		} else {
			sendLog("error", "Generation failed: No result returned");
			return { success: false, error: "No result returned" };
		}
	} catch (error: any) {
		sendLog("error", `Midjourney generation failed: ${error.message}`);
		return { success: false, error: error.message };
	}
});

// Midjourney upscale
ipcMain.handle("midjourney-upscale", async (event, index: number, messageId: string, messageHash: string) => {
	try {
		const client = await initializeMidjourney();
		if (!client) {
			return { success: false, error: "Midjourney client not initialized" };
		}

		sendLog("info", `Upscaling image ${index}`);
		const result = await client.Upscale({
			index,
			msgId: messageId,
			hash: messageHash,
			flags: 0,
		});

		if (result) {
			return { success: true, imageUrl: result.uri };
		} else {
			return { success: false, error: "Upscale failed" };
		}
	} catch (error: any) {
		sendLog("error", `Upscale failed: ${error.message}`);
		return { success: false, error: error.message };
	}
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
