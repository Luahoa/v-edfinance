#!/usr/bin/env bun

/**
 * Ralph Loop CLI - Entry Point
 * Autonomous epic execution automation
 */

// Graceful shutdown handlers
let isShuttingDown = false;
const shutdown = (signal: string): void => {
	if (isShuttingDown) return;
	isShuttingDown = true;
	console.error(`\n${signal} received, shutting down...`);
	process.exitCode = 130;
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

import { createCliInstance, registerGlobalFlags } from "./cli/cli-config.js";
import { registerCommands } from "./cli/command-registry.js";
import { logger } from "./utils/logger.js";

// Set proper output encoding
if (process.stdout.setEncoding) {
	process.stdout.setEncoding("utf8");
}
if (process.stderr.setEncoding) {
	process.stderr.setEncoding("utf8");
}

const cli = createCliInstance();
registerCommands(cli);
registerGlobalFlags(cli);

// Parse options
const parsed = cli.parse(process.argv, { run: false });

// Main execution
(async () => {
	try {
		// Handle version
		if (parsed.options.version) {
			console.log("ralph version 1.0.0");
			process.exitCode = 0;
			return;
		}

		// Handle help
		if (parsed.options.help || (!cli.matchedCommand && parsed.args.length === 0)) {
			cli.outputHelp();
			process.exitCode = 0;
			return;
		}

		// Configure logger
		const isVerbose =
			parsed.options.verbose ||
			process.env.RALPH_VERBOSE === "1" ||
			process.env.RALPH_VERBOSE === "true";

		if (isVerbose) {
			logger.setVerbose(true);
		}

		if (parsed.options.logFile) {
			logger.setLogFile(parsed.options.logFile);
		}

		logger.verbose("Ralph CLI starting", {
			command: parsed.args[0] || "none",
			options: parsed.options,
			cwd: process.cwd(),
		});

		// Run matched command
		await cli.runMatchedCommand();
	} catch (error) {
		console.error("CLI error:", error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
})().catch((error) => {
	console.error("Unhandled error:", error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
