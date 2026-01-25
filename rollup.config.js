import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import postcssProcessor from 'postcss';
import cssnano from 'cssnano';

const library = 'SimpleConsent';
const isProduction = process.env.NODE_ENV === 'production';

// Post-build plugin to fix newlines in minified JS
const fixMinifiedNewlines = () => ({
	name: 'fix-minified-newlines',
	writeBundle() {
		if (isProduction) {
			const jsPath = `dist/${library}.min.js`;
			try {
				let jsContent = readFileSync(jsPath, 'utf8');
				jsContent = jsContent.replace(/\\n\s+/g, '');
				writeFileSync(jsPath, jsContent);
			} catch (error) {
				console.warn(`Could not fix newlines in ${jsPath}:`, error.message);
			}
		}
	}
});

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
	// JavaScript build - unminified
	{
		input: `src/${library}.js`,
		output: {
			file: `dist/${library}.js`,
			format: 'es',
			sourcemap: !isProduction
		},
		plugins: [
			copy({
				targets: [
					{ src: `src/${library}.css`, dest: 'dist' }
				]
			}),
			copyToTestbench(),
			minifyCss()
		]
	},
	// JavaScript build - minified (production only)
	...(isProduction ? [{
		input: `src/${library}.js`,
		output: {
			file: `dist/${library}.min.js`,
			format: 'es'
		},
		plugins: [
			terser({
				format: {
					comments: /^\*!/
				},
				compress: {
					drop_console: true
				}
			}),
			fixMinifiedNewlines()
		]
	}] : [])
];
