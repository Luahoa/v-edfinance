import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../../utils/logger.js";

/**
 * ralph stop <epic-id> command
 */
export async function stopCommand(
	epicId: string,
	options: Record<string, unknown>,
): Promise<void> {
	logger.info(`Stopping Ralph Loop for epic: ${epicId}`);

	const pidFile = join(process.cwd(), `.ralph/running/${epicId}.pid`);

	if (!existsSync(pidFile)) {
		logger.error(`No running loop found for epic: ${epicId}`);
		logger.info("PID file not found. Loop may not be running.");
		process.exitCode = 1;
		return;
	}

	try {
		const pid = Number.parseInt(readFileSync(pidFile, "utf-8").trim(), 10);

		logger.info(`Found PID: ${pid}`);

		// Send signal
		const signal = options.force ? "SIGKILL" : "SIGTERM";
		logger.info(`Sending ${signal} to process ${pid}...`);

		process.kill(pid, signal);

		// Remove PID file
		unlinkSync(pidFile);

		logger.success(`Loop stopped successfully for epic: ${epicId}`);
		process.exitCode = 0;
	} catch (error) {
		logger.error(`Failed to stop loop: ${error instanceof Error ? error.message : "Unknown error"}`);
		process.exitCode = 1;
	}
}
