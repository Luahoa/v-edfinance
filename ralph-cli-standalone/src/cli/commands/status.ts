import { LoopEngine } from "../../core/loop-engine.js";
import { loadConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

/**
 * ralph status <epic-id> command
 */
export async function statusCommand(
	epicId: string,
	options: Record<string, unknown>,
): Promise<void> {
	try {
		const config = loadConfig();
		const engine = new LoopEngine(config);

		const status = await engine.getStatus(epicId);

		if (options.json) {
			console.log(JSON.stringify(status, null, 2));
		} else {
			logger.info(`Epic: ${status.epicId}`);
			logger.info(`Status: ${status.status}`);
			logger.info(`Iteration: ${status.iteration}/${status.maxIterations}`);

			if (status.lastQualityGate) {
				logger.info(`Last quality gate: ${status.lastQualityGate}`);
			}
		}

		process.exitCode = 0;
	} catch (error) {
		logger.error(error instanceof Error ? error.message : "Unknown error");
		process.exitCode = 1;
	}
}
