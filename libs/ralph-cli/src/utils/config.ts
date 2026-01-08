import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Zod schema for ralph.config.json
 */
export const ConfigSchema = z.object({
	maxIterations: z.number().int().positive().default(30),
	defaultWorkers: z.number().int().nonnegative().default(0),
	qualityGates: z.boolean().default(true),
	knowledgeExtraction: z.boolean().default(true),
	beadsCommand: z.string().default(process.platform === "win32" ? "beads.exe" : "bd"),
	bvCommand: z.string().default(process.platform === "win32" ? "bv.exe" : "bv"),
	qualityGateScript: z.string().default("scripts/quality-gate.sh"),
	knowledgeExtractionPrompt: z.string().default(".agents/skills/knowledge/epic-completion-prompt.txt"),
	historyDir: z.string().default("history/"),
	logDir: z.string().default(".ralph/logs/"),
});

export type RalphConfig = z.infer<typeof ConfigSchema>;

/**
 * Load ralph configuration from file or use defaults
 */
export function loadConfig(configPath?: string): RalphConfig {
	const defaultPath = join(process.cwd(), "ralph.config.json");
	const path = configPath || defaultPath;

	if (!existsSync(path)) {
		// Return defaults if config file doesn't exist
		return ConfigSchema.parse({});
	}

	try {
		const content = readFileSync(path, "utf-8");
		const json = JSON.parse(content);
		return ConfigSchema.parse(json);
	} catch (error) {
		throw new Error(
			`Failed to load config from ${path}: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Get configuration value with environment variable override
 */
export function getConfigValue<K extends keyof RalphConfig>(
	config: RalphConfig,
	key: K,
	envVar?: string,
): RalphConfig[K] {
	if (envVar && process.env[envVar]) {
		const envValue = process.env[envVar];
		const schemaKey = ConfigSchema.shape[key];

		// Handle number types
		if (schemaKey instanceof z.ZodNumber || schemaKey instanceof z.ZodDefault) {
			const parsed = Number.parseInt(envValue, 10);
			if (!Number.isNaN(parsed)) {
				return parsed as RalphConfig[K];
			}
		}

		// Handle boolean types
		if (schemaKey instanceof z.ZodBoolean || schemaKey instanceof z.ZodDefault) {
			if (envValue === "true" || envValue === "1") {
				return true as RalphConfig[K];
			}
			if (envValue === "false" || envValue === "0") {
				return false as RalphConfig[K];
			}
		}

		// Handle string types
		return envValue as RalphConfig[K];
	}

	return config[key];
}
