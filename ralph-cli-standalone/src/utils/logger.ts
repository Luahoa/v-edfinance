import { appendFileSync } from "node:fs";
import pc from "picocolors";

class Logger {
	private isVerbose = false;
	private logFile: string | null = null;

	setVerbose(enabled: boolean): void {
		this.isVerbose = enabled;
	}

	setLogFile(path: string): void {
		this.logFile = path;
	}

	log(message: string, data?: unknown): void {
		console.log(message);
		this.writeToFile("INFO", message, data);
	}

	info(message: string, data?: unknown): void {
		console.log(pc.cyan(`ℹ ${message}`));
		this.writeToFile("INFO", message, data);
	}

	success(message: string, data?: unknown): void {
		console.log(pc.green(`✓ ${message}`));
		this.writeToFile("SUCCESS", message, data);
	}

	warn(message: string, data?: unknown): void {
		console.log(pc.yellow(`⚠ ${message}`));
		this.writeToFile("WARN", message, data);
	}

	error(message: string, data?: unknown): void {
		console.error(pc.red(`✖ ${message}`));
		this.writeToFile("ERROR", message, data);
	}

	verbose(message: string, data?: unknown): void {
		if (this.isVerbose) {
			console.log(pc.dim(`[verbose] ${message}`));
			this.writeToFile("VERBOSE", message, data);
		}
	}

	private writeToFile(level: string, message: string, data?: unknown): void {
		if (!this.logFile) return;

		const timestamp = new Date().toISOString();
		const logLine = data
			? `[${timestamp}] ${level}: ${message} ${JSON.stringify(data)}\n`
			: `[${timestamp}] ${level}: ${message}\n`;

		try {
			appendFileSync(this.logFile, logLine);
		} catch {
			// Silently fail if log file write fails
		}
	}
}

export const logger = new Logger();
