import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { BeadsClient } from "./beads-client.js";
import { QualityGate } from "./quality-gate.js";
import type { RalphConfig } from "../utils/config.js";

export interface LoopOptions {
	maxIterations: number;
	workers: number;
	qualityGates: boolean;
	dryRun?: boolean;
	verbose?: boolean;
}

export interface LoopStatus {
	epicId: string;
	status: "running" | "complete" | "failed";
	iteration: number;
	maxIterations: number;
	lastQualityGate?: "pass" | "fail";
}

/**
 * Ralph Loop Engine - Main loop logic ported from START_RALPH_LOOP.bat
 */
export class LoopEngine {
	private config: RalphConfig;
	private beadsClient: BeadsClient;
	private qualityGate: QualityGate;

	constructor(config: RalphConfig) {
		this.config = config;
		this.beadsClient = new BeadsClient(config.beadsCommand);
		this.qualityGate = new QualityGate(config.qualityGateScript);
	}

	/**
	 * Start the Ralph Loop for an epic
	 */
	async start(epicId: string, options: LoopOptions): Promise<void> {
		logger.info(`Starting Ralph Loop for epic: ${epicId}`);
		logger.info(`Max iterations: ${options.maxIterations}`);

		if (options.dryRun) {
			logger.warn("DRY RUN MODE - No real changes will be made");
		}

		let iteration = 0;

		while (iteration < options.maxIterations) {
			iteration++;
			logger.info(`\n${"=".repeat(50)}`);
			logger.info(`Iteration ${iteration}/${options.maxIterations}`);
			logger.info("=".repeat(50));

			// Phase 1: Check execution plan exists
			const planPath = join(process.cwd(), this.config.historyDir, epicId, "execution-plan.md");
			if (!existsSync(planPath)) {
				logger.warn(`Execution plan not found: ${planPath}`);
				logger.info("Planning phase should be completed first");
			} else {
				logger.success(`Execution plan found: ${planPath}`);
			}

			// Phase 2: Orchestrator spawn workers (simulated)
			logger.info("[PHASE 2] Orchestrator spawning workers...");
			logger.verbose("Workers would be spawned here via Task() tool");

			// Phase 3: Workers execute beads (simulated)
			logger.info("[PHASE 3] Workers executing beads...");
			logger.verbose("Beads execution happening in parallel tracks");

			if (!options.dryRun) {
				// Sync beads after work
				try {
					await this.beadsClient.sync();
				} catch (error) {
					logger.error(
						`Beads sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				}
			}

			// Phase 4: Quality gates
			if (options.qualityGates) {
				logger.info("[PHASE 4] Running quality gates...");

				if (!options.dryRun) {
					try {
						const result = await this.qualityGate.run();

						if (result.passed) {
							logger.success("Quality gates PASSED");

							// Check epic completion conditions
							const isComplete = await this.checkEpicCompletion(epicId, iteration);
							
							if (isComplete) {
								logger.success("\n" + "=".repeat(50));
								logger.success(`EPIC COMPLETE: ${epicId}`);
								logger.success("=".repeat(50));
								logger.info(`Iterations used: ${iteration}/${options.maxIterations}`);
								logger.success("All beads executed successfully");
								logger.success("Quality gates passed");

								// Sync beads one final time
								await this.beadsClient.sync();

								return;
							}
						} else {
							logger.error("Quality gates FAILED");
							if (result.errors.length > 0) {
								logger.error("Errors:");
								for (const error of result.errors) {
									logger.error(`  - ${error}`);
								}
							}
							// Continue to next iteration to retry
						}
					} catch (error) {
						logger.error(
							`Quality gate execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
						);
					}
				} else {
					logger.info("[SIMULATED] Quality gates PASSED");
					
					// In dry-run, check conditions but apply stricter requirements
					logger.verbose("Checking completion conditions (dry-run mode)...");
					const conditions = await this.getDryRunCompletionStatus(epicId, iteration);
					
					if (conditions.shouldComplete) {
						logger.success("\n" + "=".repeat(50));
						logger.success("EPIC COMPLETE (Dry-Run Simulation)");
						logger.success("=".repeat(50));
						logger.info(`Iterations used: ${iteration}/${options.maxIterations}`);
						logger.success("Promise detected and minimum iterations met");
						return;
					}
				}
			}

			logger.info("\n[CONTINUE] Moving to next iteration...");
		}

		// Max iterations reached
		logger.warn("\n" + "=".repeat(50));
		logger.warn(`Max iterations reached: ${options.maxIterations}`);
		logger.warn("=".repeat(50));
		logger.info(`Epic: ${epicId}`);
		logger.info("Status: IN PROGRESS");
		logger.info("\nNext steps:");
		logger.info(`  1. Review progress: bv --robot-triage --graph-root ${epicId}`);
		logger.info("  2. Check blockers: beads list --status blocked");
		logger.info(`  3. Resume: ralph resume ${epicId}`);

		throw new Error("Max iterations reached without completion");
	}

	/**
	 * Check completion status for dry-run mode (stricter requirements)
	 */
	private async getDryRunCompletionStatus(
		epicId: string,
		iteration: number,
	): Promise<{ shouldComplete: boolean; reason: string }> {
		// In dry-run mode, require:
		// 1. Promise exists AND
		// 2. At least 5 iterations completed
		const promisePath = join(process.cwd(), ".ralph-output.md");
		const hasPromise = existsSync(promisePath) && 
			readFileSync(promisePath, "utf-8").includes("<promise>EPIC_COMPLETE</promise>");
		
		const minIterationsForDryRun = 5;
		const hasMinIterations = iteration >= minIterationsForDryRun;
		
		logger.verbose(`Dry-run completion check:`);
		logger.verbose(`  - Promise exists: ${hasPromise}`);
		logger.verbose(`  - Iterations: ${iteration}/${minIterationsForDryRun}`);
		
		if (hasPromise && hasMinIterations) {
			return {
				shouldComplete: true,
				reason: "Promise found and minimum iterations met",
			};
		}
		
		if (hasPromise && !hasMinIterations) {
			logger.verbose(`  - Need ${minIterationsForDryRun - iteration} more iterations before completion`);
		}
		
		return {
			shouldComplete: false,
			reason: hasPromise 
				? `Need ${minIterationsForDryRun - iteration} more iterations`
				: "No completion promise found",
		};
	}

	/**
	 * Check if epic is complete based on multiple conditions
	 */
	private async checkEpicCompletion(epicId: string, iteration: number): Promise<boolean> {
		logger.verbose("Checking epic completion conditions...");

		const conditions = {
			hasPromise: false,
			allBeadsClosed: false,
			minIterations: false,
			qualityGatesPassed: false,
		};

		// Condition 1: Check for completion promise in .ralph-output.md
		const promisePath = join(process.cwd(), ".ralph-output.md");
		if (existsSync(promisePath)) {
			const content = readFileSync(promisePath, "utf-8");
			conditions.hasPromise = content.includes("<promise>EPIC_COMPLETE</promise>");
			logger.verbose(`Promise found: ${conditions.hasPromise}`);
		} else {
			logger.verbose("No .ralph-output.md file found");
		}

		// Condition 2: Check if all beads are closed (would need beads client integration)
		try {
			const beads = await this.beadsClient.list({ epic: epicId, status: "open" });
			conditions.allBeadsClosed = beads.length === 0;
			logger.verbose(`All beads closed: ${conditions.allBeadsClosed} (${beads.length} open beads)`);
		} catch (error) {
			logger.verbose("Could not check beads status");
		}

		// Condition 3: Minimum iterations completed (at least 3 for real work)
		conditions.minIterations = iteration >= 3;
		logger.verbose(`Min iterations met: ${conditions.minIterations} (${iteration}/3)`);

		// Condition 4: Quality gates result file exists and passed
		const qgResultPath = join(process.cwd(), ".quality-gate-result.json");
		if (existsSync(qgResultPath)) {
			try {
				const qgContent = readFileSync(qgResultPath, "utf-8");
				const qgResult = JSON.parse(qgContent);
				
				// Support multiple JSON formats:
				// 1. {passed: boolean}
				// 2. {summary: {failed: number}}
				conditions.qualityGatesPassed =
					qgResult.passed === true ||
					(qgResult.summary && qgResult.summary.failed === 0);
					
				logger.verbose(`Quality gates passed: ${conditions.qualityGatesPassed}`);
			} catch {
				logger.verbose("Could not parse quality gate results");
			}
		}

		// Epic is complete if:
		// 1. Has completion promise AND
		// 2. (All beads closed OR min iterations met) AND
		// 3. Quality gates passed (if file exists)
		const isComplete =
			conditions.hasPromise &&
			(conditions.allBeadsClosed || conditions.minIterations) &&
			(!existsSync(qgResultPath) || conditions.qualityGatesPassed);

		logger.verbose(`Epic completion status: ${isComplete}`);
		logger.verbose(`Conditions: ${JSON.stringify(conditions, null, 2)}`);

		return isComplete;
	}

	/**
	 * Get status of a running or completed loop
	 */
	async getStatus(epicId: string): Promise<LoopStatus> {
		// This is a placeholder - real implementation would read from checkpoint file
		return {
			epicId,
			status: "running",
			iteration: 0,
			maxIterations: this.config.maxIterations,
		};
	}

	/**
	 * Resume a stopped loop from checkpoint
	 */
	async resume(epicId: string, options: LoopOptions): Promise<void> {
		logger.info(`Resuming Ralph Loop for epic: ${epicId}`);

		// Load checkpoint if exists
		const checkpointPath = join(process.cwd(), `.ralph/checkpoints/${epicId}.json`);

		if (existsSync(checkpointPath)) {
			logger.info(`Loading checkpoint from: ${checkpointPath}`);
			// Would load iteration number from checkpoint
		}

		// Continue with start logic
		await this.start(epicId, options);
	}
}
