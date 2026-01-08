import type { CAC } from "cac";

/**
 * Register all ralph commands
 */
export function registerCommands(cli: CAC): void {
	// Commands will be registered here
	// Placeholder for now - will be implemented in Track 3

	// ralph start <epic-id>
	cli
		.command("start <epic-id>", "Start Ralph Loop for an epic")
		.option("--max-iter <number>", "Maximum iterations", { default: 30 })
		.option("--workers <number>", "Number of parallel workers", { default: 0 })
		.option("--skip-quality-gates", "Skip quality gate verification")
		.option("--dry-run", "Simulate execution without real changes")
		.action(async (epicId: string, options: Record<string, unknown>) => {
			const { startCommand } = await import("./commands/start.js");
			await startCommand(epicId, options);
		});

	// ralph stop <epic-id>
	cli
		.command("stop <epic-id>", "Stop running loop gracefully")
		.option("--force", "Force stop (SIGKILL)")
		.action(async (epicId: string, options: Record<string, unknown>) => {
			const { stopCommand } = await import("./commands/stop.js");
			await stopCommand(epicId, options);
		});

	// ralph status <epic-id>
	cli
		.command("status <epic-id>", "View loop status and progress")
		.action(async (epicId: string, options: Record<string, unknown>) => {
			const { statusCommand } = await import("./commands/status.js");
			await statusCommand(epicId, options);
		});

	// ralph list
	cli
		.command("list", "List all epics with loop history")
		.option("--status <status>", "Filter by status (running|complete|failed)")
		.action(async (options: Record<string, unknown>) => {
			const { listCommand } = await import("./commands/list.js");
			await listCommand(options);
		});

	// ralph resume <epic-id>
	cli
		.command("resume <epic-id>", "Resume stopped loop from checkpoint")
		.option("--from-iteration <number>", "Resume from specific iteration")
		.action(async (epicId: string, options: Record<string, unknown>) => {
			const { resumeCommand } = await import("./commands/resume.js");
			await resumeCommand(epicId, options);
		});
}
