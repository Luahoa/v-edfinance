import { BeadsClient } from "../../core/beads-client.js";
import { loadConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

/**
 * ralph list command
 */
export async function listCommand(options: Record<string, unknown>): Promise<void> {
	try {
		const config = loadConfig();
		const client = new BeadsClient(config.beadsCommand);

		const status = options.status as "open" | "in_progress" | "blocked" | "closed" | undefined;

		const beads = await client.list({ status });

		if (options.json) {
			console.log(JSON.stringify(beads, null, 2));
		} else {
			if (beads.length === 0) {
				logger.info("No beads found");
			} else {
				logger.info(`Found ${beads.length} beads:`);
				for (const bead of beads) {
					logger.info(`  ${bead.id}: ${bead.title} (${bead.status})`);
				}
			}
		}

		process.exitCode = 0;
	} catch (error) {
		logger.error(error instanceof Error ? error.message : "Unknown error");
		process.exitCode = 1;
	}
}
