import ora from "ora";
import { LoopEngine } from "../../core/loop-engine";
import { loadConfig, getConfigValue } from "../../utils/config";
import { logger } from "../../utils/logger";
import type { LoopOptions } from "../../core/loop-engine";

/**
 * ralph start <epic-id> command
 */
export async function startCommand(
	epicId: string,
	options: Record<string, unknown>,
): Promise<void> {
	const spinner = ora("Initializing Ralph Loop...").start();

	try {
		// Load configuration
		const config = loadConfig();

		// Build loop options
		const maxIterations =
			(options.maxIter as number) || getConfigValue(config, "maxIterations", "RALPH_MAX_ITER");

		const workers =
			(options.workers as number) || getConfigValue(config, "defaultWorkers");

		const qualityGates = options.skipQualityGates
			? false
			: getConfigValue(config, "qualityGates");

		const loopOptions: LoopOptions = {
			maxIterations,
			workers,
			qualityGates,
			dryRun: options.dryRun as boolean,
			verbose: options.verbose as boolean,
		};

		spinner.succeed("Configuration loaded");

		// Create loop engine
		const engine = new LoopEngine(config);

		// Start the loop
		await engine.start(epicId, loopOptions);

		logger.success("\nRalph Loop completed successfully!");
		process.exitCode = 0;
	} catch (error) {
		spinner.fail("Ralph Loop failed");
		logger.error(error instanceof Error ? error.message : "Unknown error");
		process.exitCode = 1;
	}
}
