import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import postcssProcessor from 'postcss';
import cssnano from 'cssnano';

const library = 'SimpleConsent';
const isProduction = process.env.NODE_ENV === 'production';

// Read package version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const packageVersion = packageJson.version;


// Plugin to copy files to testbench/assets
const copyToTestbench = () => ({
	name: 'copy-to-testbench',
	writeBundle() {
		const testbenchDir = 'testbench/assets';
		mkdirSync(testbenchDir, { recursive: true });
		
		copyFileSync(`src/${library}.js`, `${testbenchDir}/${library}.js`);
		copyFileSync(`src/${library}.css`, `${testbenchDir}/${library}.css`);
	}
});

// Plugin to inject package version
const injectVersion = () => ({
	name: 'inject-version',
	transform(code, id) {
		// Only transform the source file, not intermediate files
		if (id.includes(`src/${library}.js`) && !id.includes('node_modules')) {
			// Replace placeholder with actual package version
			code = code.replace(/\{\{package\.version\}\}/g, packageVersion);
			// Return code with empty sourcemap (simple text replacement doesn't need sourcemap)
			return {
				code,
				map: { mappings: '' }
			};
		}
		return null;
	}
});

// Plugin to minify CSS in production
const minifyCss = () => ({
	name: 'minify-css',
	async writeBundle() {
		if (isProduction) {
			const cssPath = `dist/${library}.css`;
			const minCssPath = `dist/${library}.min.css`;
			try {
				const cssContent = readFileSync(cssPath, 'utf8');
				const processor = postcssProcessor([cssnano()]);
				const result = await processor.process(cssContent, { from: cssPath, to: minCssPath });
				writeFileSync(minCssPath, result.css);
			} catch (error) {
				console.warn(`Could not minify CSS:`, error.message);
			}
		}
	}
});

export default [
	// ES Module build - unminified (for bundlers)
	{
		input: `src/${library}.js`,
		output: {
			file: `dist/${library}.js`,
			format: 'es',
			sourcemap: !isProduction
		},
		plugins: [
			injectVersion(),
			copy({
				targets: [
					{ src: `src/${library}.css`, dest: 'dist' }
				]
			}),
			copyToTestbench(),
			minifyCss()
		]
	},
	// ES Module build - minified (production only)
	...(isProduction ? [{
		input: `src/${library}.js`,
		output: {
			file: `dist/${library}.min.js`,
			format: 'es'
		},
		plugins: [
			injectVersion(),
			terser({
				format: {
					comments: /^\*!/
				},
				compress: {
					drop_console: true
				}
			})
		]
	}] : [])
];
