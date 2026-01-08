import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface QualityGateResult {
	passed: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Quality gate integration
 */
export class QualityGate {
	private scriptPath: string;

	constructor(scriptPath?: string) {
		this.scriptPath = scriptPath || "scripts/quality-gate.sh";
	}

	/**
	 * Run quality gate script
	 */
	async run(): Promise<QualityGateResult> {
		return new Promise((resolve, reject) => {
			// Determine shell and script execution based on platform
			const isWindows = process.platform === "win32";
			const isBatchScript = this.scriptPath.endsWith(".bat") || this.scriptPath.endsWith(".cmd");
			
			let command: string;
			let args: string[];
			
			if (isWindows && isBatchScript) {
				// Windows batch file - use cmd.exe
				command = "cmd.exe";
				args = ["/c", this.scriptPath];
			} else if (isWindows) {
				// Windows bash script - use bash (via WSL or Git Bash)
				command = "bash";
				args = [this.scriptPath];
			} else {
				// Unix - use sh
				command = "sh";
				args = [this.scriptPath];
			}

			const proc = spawn(command, args, {
				stdio: ["ignore", "pipe", "pipe"],
				shell: false,
			});

			let stdout = "";
			let stderr = "";

			proc.stdout?.on("data", (data) => {
				stdout += data.toString();
			});

			proc.stderr?.on("data", (data) => {
				stderr += data.toString();
			});

			proc.on("close", (code) => {
				// Try to read JSON result file
				const resultPath = join(process.cwd(), ".quality-gate-result.json");

				if (existsSync(resultPath)) {
					try {
						const content = readFileSync(resultPath, "utf-8");
						const result = JSON.parse(content);

						// Check if quality gate passed
						// Support multiple JSON formats:
						// 1. {passed: boolean}
						// 2. {summary: {failed: number}}
						const passed =
							result.passed === true ||
							(result.summary && result.summary.failed === 0);

						resolve({
							passed,
							errors: result.errors || [],
							warnings: result.warnings || [],
						});
						return;
					} catch {
						// Fall through to code-based result
					}
				}

				// Fallback to exit code
				if (code === 0) {
					resolve({
						passed: true,
						errors: [],
						warnings: [],
					});
				} else {
					resolve({
						passed: false,
						errors: stderr.split("\n").filter((line) => line.trim()),
						warnings: [],
					});
				}
			});

			proc.on("error", reject);
		});
	}
}
