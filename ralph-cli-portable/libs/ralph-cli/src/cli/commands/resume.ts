import ora from "ora";
import { LoopEngine } from "../../core/loop-engine.js";
import { loadConfig, getConfigValue } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";
import type { LoopOptions } from "../../core/loop-engine.js";

/**
 * ralph resume <epic-id> command
 */
export async function resumeCommand(
	epicId: string,
	options: Record<string, unknown>,
): Promise<void> {
	const spinner = ora("Resuming Ralph Loop...").start();

	try {
		const config = loadConfig();

		const maxIterations = getConfigValue(config, "maxIterations", "RALPH_MAX_ITER");
		const workers = getConfigValue(config, "defaultWorkers");
		const qualityGates = getConfigValue(config, "qualityGates");

		const loopOptions: LoopOptions = {
			maxIterations,
			workers,
			qualityGates,
			verbose: options.verbose as boolean,
		};

		spinner.succeed("Configuration loaded");

		const engine = new LoopEngine(config);

		// Resume from checkpoint
		await engine.resume(epicId, loopOptions);

		logger.success("\nRalph Loop resumed successfully!");
		process.exitCode = 0;
	} catch (error) {
		spinner.fail("Ralph Loop resume failed");
		logger.error(error instanceof Error ? error.message : "Unknown error");
		process.exitCode = 1;
	}
}
