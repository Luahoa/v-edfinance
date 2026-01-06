import { spawn } from "node:child_process";

export interface BeadsListOptions {
	status?: "open" | "in_progress" | "blocked" | "closed";
	epic?: string;
}

export interface BeadInfo {
	id: string;
	title: string;
	status: string;
	epic?: string;
}

/**
 * Client for interacting with beads commands
 */
export class BeadsClient {
	private beadsCommand: string;

	constructor(beadsCommand?: string) {
		this.beadsCommand = beadsCommand || (process.platform === "win32" ? "beads.exe" : "bd");
	}

	/**
 * Sync beads with --no-daemon flag
	 */
	async sync(): Promise<void> {
		return new Promise((resolve, reject) => {
			const proc = spawn(this.beadsCommand, ["sync", "--no-daemon"], {
				stdio: "inherit",
				shell: false,
			});

			proc.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`beads sync failed with code ${code}`));
				}
			});

			proc.on("error", reject);
		});
	}

	/**
	 * List beads with optional filters
	 */
	async list(options?: BeadsListOptions): Promise<BeadInfo[]> {
		const args = ["list"];

		if (options?.status) {
			args.push("--status", options.status);
		}

		if (options?.epic) {
			args.push("--epic", options.epic);
		}

		// For now, return empty array - full implementation would parse JSON output
		return [];
	}

	/**
	 * Update bead status
	 */
	async update(beadId: string, status: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const proc = spawn(this.beadsCommand, ["update", beadId, "--status", status], {
				stdio: "inherit",
				shell: false,
			});

			proc.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`beads update failed with code ${code}`));
				}
			});

			proc.on("error", reject);
		});
	}

	/**
	 * Close a bead
	 */
	async close(beadId: string, reason: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const proc = spawn(this.beadsCommand, ["close", beadId, "--reason", reason], {
				stdio: "inherit",
				shell: false,
			});

			proc.on("close", (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`beads close failed with code ${code}`));
				}
			});

			proc.on("error", reject);
		});
	}
}
