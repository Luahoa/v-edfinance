import * as fs from 'fs/promises';
import * as path from 'path';
import { generateSampleCertificate } from './template-renderer';

/**
 * Test script to generate preview HTML files for all locales
 * Run: npx tsx apps/api/src/modules/certificates/templates/preview-generator.ts
 */
async function main() {
  const outputDir = path.join(__dirname, '../../../../temp_previews');
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  console.log('🎨 Generating certificate previews...\n');

  for (const locale of ['vi', 'en', 'zh'] as const) {
    const html = await generateSampleCertificate(locale);
    const outputPath = path.join(outputDir, `certificate-preview-${locale}.html`);
    
    await fs.writeFile(outputPath, html, 'utf-8');
    console.log(`✅ Created: ${outputPath}`);
  }

  console.log('\n✨ Preview files generated successfully!');
  console.log(`📂 Location: ${outputDir}`);
  console.log('🌐 Open in browser to preview:\n');
  console.log(`   - Vietnamese: file://${path.join(outputDir, 'certificate-preview-vi.html')}`);
  console.log(`   - English:    file://${path.join(outputDir, 'certificate-preview-en.html')}`);
  console.log(`   - Chinese:    file://${path.join(outputDir, 'certificate-preview-zh.html')}`);
}

main().catch(console.error);
