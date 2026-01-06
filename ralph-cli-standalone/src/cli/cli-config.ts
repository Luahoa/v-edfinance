import { cac } from "cac";
import type { CAC } from "cac";

/**
 * Create CLI instance with ralph configuration
 */
export function createCliInstance(): CAC {
	const cli = cac("ralph");

	cli.version("1.0.0").help();

	return cli;
}

/**
 * Register global flags available to all commands
 */
export function registerGlobalFlags(cli: CAC): void {
	// Global options
	cli.option("--verbose", "Enable verbose logging");
	cli.option("--json", "Output in JSON format for CI/CD");
	cli.option("--log-file <path>", "Write logs to file");
	cli.option("--max-iter <number>", "Maximum iterations (default: 30)");
}
