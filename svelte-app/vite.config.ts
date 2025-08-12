import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	
	// Configure for Electron compatibility
	base: mode === 'electron' ? './' : '/',
	
	build: {
		// Output directory for Electron builds
		outDir: mode === 'electron' ? '../dist-svelte' : 'build',
		
		// Ensure assets are properly referenced
		assetsDir: 'assets',
		
		// Generate source maps for debugging
		sourcemap: mode === 'development',
		
		// Optimize for Electron
		target: mode === 'electron' ? 'chrome100' : 'esnext',
		
		rollupOptions: {
			// Ensure proper chunking for Electron
			output: {
				manualChunks: undefined
			}
		}
	},
	
	server: {
		// Allow external connections for development
		host: true,
		port: 5173,
		strictPort: false
	},
	
	// Configure path resolution
	resolve: {
		alias: {
			$lib: '/src/lib'
		}
	},
	
	// Optimize dependencies
	optimizeDeps: {
		include: ['lucide-svelte']
	}
}));
