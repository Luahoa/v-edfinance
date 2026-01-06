import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RalphConfig } from "../utils/config.js";
import { logger } from "../utils/logger.js";

/**
 * Knowledge Extraction Module
 * 
 * Integrates with Amp to extract knowledge from epic threads
 * and update project documentation after epic completion.
 */
export class KnowledgeExtractor {
	private config: RalphConfig;
	private promptPath: string;

	constructor(config: RalphConfig) {
		this.config = config;
		this.promptPath = join(process.cwd(), config.knowledgeExtractionPrompt);
	}

	/**
	 * Extract knowledge after epic completion
	 */
	async extract(epicId: string): Promise<void> {
		logger.info("\n[PHASE 5] Knowledge extraction...");

		// Check if knowledge extraction is enabled
		if (!this.config.knowledgeExtraction) {
			logger.info("Knowledge extraction disabled in config");
			return;
		}

		try {
			// Check if prompt file exists
			if (!existsSync(this.promptPath)) {
				logger.warn(`Knowledge extraction prompt not found: ${this.promptPath}`);
				logger.info("Creating default prompt...");
				this.createDefaultPrompt();
			}

			// Read prompt template
			const promptTemplate = readFileSync(this.promptPath, "utf-8");
			const prompt = promptTemplate.replace("{{EPIC_ID}}", epicId);

			// Create knowledge extraction marker file
			const markerPath = join(
				process.cwd(),
				this.config.historyDir,
				epicId,
				"knowledge-extraction-pending.txt"
			);

			writeFileSync(markerPath, prompt, "utf-8");

			logger.success("Knowledge extraction prompt created");
			logger.info(`Location: ${markerPath}`);
			logger.info("\nTo complete knowledge extraction:");
			logger.info("  1. Ask your AI agent:");
			logger.info(`     "Document epic ${epicId} using the knowledge skill"`);
			logger.info("  2. Agent will:");
			logger.info("     - Find threads for this epic");
			logger.info("     - Extract topics, decisions, patterns");
			logger.info("     - Verify against code");
			logger.info("     - Update AGENTS.md and docs/");
			logger.info("     - Create diagrams with citations");

		} catch (error) {
			logger.error(
				`Knowledge extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Create default knowledge extraction prompt
	 */
	private createDefaultPrompt(): void {
		const defaultPrompt = `# Knowledge Extraction Prompt

Document epic {{EPIC_ID}} using the knowledge skill.

## Instructions

/skill knowledge

## Focus Areas

Extract and document:
1. **Key Patterns**: Architecture decisions, coding patterns established
2. **Epic Execution**: How orchestrator/planning worked, track coordination
3. **Learnings**: What worked, what didn't, recommendations
4. **Code Citations**: Link all diagrams to actual code files
5. **AGENTS.md Updates**: Add new patterns to relevant sections

## Output

Expected deliverables:
- Updated AGENTS.md sections
- Mermaid diagrams with code citations
- Knowledge extraction document in docs/
- Lessons learned for future epics

## Verification

After extraction:
- [ ] Topics verified against code (not hallucinated)
- [ ] AGENTS.md updated with new patterns
- [ ] Diagrams have file citations
- [ ] Existing doc structure preserved
`;

		const promptDir = join(process.cwd(), ".agents/skills/knowledge");
		const promptPath = join(promptDir, "epic-completion-prompt.txt");

		// Create directory if it doesn't exist
		execSync(`mkdir -p "${promptDir}"`, { stdio: "ignore" });

		writeFileSync(promptPath, defaultPrompt, "utf-8");
		logger.success(`Created default prompt: ${promptPath}`);
	}

	/**
	 * Check if knowledge extraction is pending for an epic
	 */
	isPending(epicId: string): boolean {
		const markerPath = join(
			process.cwd(),
			this.config.historyDir,
			epicId,
			"knowledge-extraction-pending.txt"
		);
		return existsSync(markerPath);
	}

	/**
	 * Mark knowledge extraction as complete
	 */
	markComplete(epicId: string): void {
		const markerPath = join(
			process.cwd(),
			this.config.historyDir,
			epicId,
			"knowledge-extraction-pending.txt"
		);

		if (existsSync(markerPath)) {
			const completePath = markerPath.replace("pending", "complete");
			execSync(`mv "${markerPath}" "${completePath}"`, { stdio: "ignore" });
			logger.success("Knowledge extraction marked complete");
		}
	}
}
