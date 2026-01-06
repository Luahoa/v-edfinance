#!/usr/bin/env node

/**
 * Build Ralph CLI binaries for all platforms
 * Usage: bun run scripts/build-binaries.js
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const platforms = [
	{ os: "windows", arch: "x64", ext: ".exe" },
	{ os: "linux", arch: "x64", ext: "" },
	{ os: "darwin", arch: "x64", ext: "" },
	{ os: "darwin", arch: "arm64", ext: "" },
];

const binDir = join(process.cwd(), "bin");

// Ensure bin directory exists
if (!existsSync(binDir)) {
	mkdirSync(binDir, { recursive: true });
}

console.log("Building Ralph CLI binaries for all platforms...\n");

for (const platform of platforms) {
	const outfile = join(binDir, `ralph-${platform.os}-${platform.arch}${platform.ext}`);

	console.log(`Building for ${platform.os}-${platform.arch}...`);

	const result = spawnSync(
		"bun",
		[
			"build",
			"src/index.ts",
			"--compile",
			"--target",
			`bun-${platform.os}-${platform.arch}`,
			"--outfile",
			outfile,
		],
		{
			stdio: "inherit",
			shell: false,
		},
	);

	if (result.status === 0) {
		console.log(`✓ Built: ${outfile}\n`);
	} else {
		console.error(`✖ Failed to build for ${platform.os}-${platform.arch}\n`);
		process.exit(1);
	}
}

console.log("All binaries built successfully!");
