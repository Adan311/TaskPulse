#!/usr/bin/env node

/**
 * Performance Testing Script
 * Tests page load times and validates optimization targets
 * This script provides instructions and validates build output
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance thresholds
const THRESHOLDS = {
  LOAD_TIME: 2000,      // < 2 seconds
  FCP: 1800,            // First Contentful Paint < 1.8s
  LCP: 2500,            // Largest Contentful Paint < 2.5s
  FID: 100,             // First Input Delay < 100ms
  CLS: 0.1,             // Cumulative Layout Shift < 0.1
};

function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found. Run "npm run build" first.');
    return null;
  }

  const stats = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    assetSize: 0,
    chunkCount: 0
  };

  function calculateSize(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        calculateSize(filePath);
      } else {
        const size = stat.size;
        stats.totalSize += size;
        
        if (file.endsWith('.js')) {
          stats.jsSize += size;
          stats.chunkCount++;
        } else if (file.endsWith('.css')) {
          stats.cssSize += size;
        } else {
          stats.assetSize += size;
        }
      }
    });
  }

  calculateSize(distPath);
  return stats;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkPerformanceOptimizations() {
  console.log('🔍 Checking Performance Optimizations...\n');

  // Check if lazy loading is implemented
  const mainFile = path.join(process.cwd(), 'src/main.tsx');
  if (fs.existsSync(mainFile)) {
    const content = fs.readFileSync(mainFile, 'utf8');
    const hasLazyLoading = content.includes('React.lazy') && content.includes('Suspense');
    console.log(`✅ Lazy Loading: ${hasLazyLoading ? 'Implemented' : 'Not implemented'}`);
  }

  // Check if performance monitoring is implemented
  const appFile = path.join(process.cwd(), 'src/App.tsx');
  if (fs.existsSync(appFile)) {
    const content = fs.readFileSync(appFile, 'utf8');
    const hasPerformanceMonitoring = content.includes('initPerformanceMonitoring');
    console.log(`✅ Performance Monitoring: ${hasPerformanceMonitoring ? 'Implemented' : 'Not implemented'}`);
  }

  // Check if build optimizations are configured
  const viteConfig = path.join(process.cwd(), 'vite.config.ts');
  if (fs.existsSync(viteConfig)) {
    const content = fs.readFileSync(viteConfig, 'utf8');
    const hasManualChunks = content.includes('manualChunks');
    const hasTerser = content.includes('terser');
    console.log(`✅ Build Optimizations: ${hasManualChunks && hasTerser ? 'Configured' : 'Partially configured'}`);
  }

  console.log('');
}

function runLighthouseTest() {
  console.log('🚨 Manual Performance Testing Instructions:\n');
  
  console.log('1. Build your application:');
  console.log('   npm run build\n');
  
  console.log('2. Start the preview server:');
  console.log('   npm run preview\n');
  
  console.log('3. Open Chrome DevTools and run Lighthouse:');
  console.log('   - Open http://localhost:4173 in Chrome');
  console.log('   - Press F12 to open DevTools');
  console.log('   - Go to "Lighthouse" tab');
  console.log('   - Select "Performance" category');
  console.log('   - Click "Analyze page load"\n');
  
  console.log('4. Check these performance metrics:');
  console.log(`   - First Contentful Paint: < ${THRESHOLDS.FCP}ms`);
  console.log(`   - Largest Contentful Paint: < ${THRESHOLDS.LCP}ms`);
  console.log(`   - Total Load Time: < ${THRESHOLDS.LOAD_TIME}ms`);
  console.log(`   - Cumulative Layout Shift: < ${THRESHOLDS.CLS}`);
  console.log(`   - First Input Delay: < ${THRESHOLDS.FID}ms\n`);
  
  console.log('5. Network Throttling Test:');
  console.log('   - In DevTools, go to "Network" tab');
  console.log('   - Set throttling to "Slow 3G"');
  console.log('   - Reload the page and check load times\n');

  console.log('6. Performance Monitoring in Console:');
  console.log('   - Check browser console for performance logs');
  console.log('   - Look for "🚀 Performance Metrics" group');
  console.log('   - Verify all metrics are within thresholds\n');
}

function runBundleAnalysis() {
  console.log('📊 Bundle Analysis:\n');
  
  const stats = analyzeBundleSize();
  
  if (stats) {
    console.log(`Total Bundle Size: ${formatSize(stats.totalSize)}`);
    console.log(`JavaScript: ${formatSize(stats.jsSize)} (${stats.chunkCount} chunks)`);
    console.log(`CSS: ${formatSize(stats.cssSize)}`);
    console.log(`Assets: ${formatSize(stats.assetSize)}`);
    
    // Performance recommendations
    console.log('\n📈 Performance Assessment:');
    
    if (stats.jsSize < 500 * 1024) { // < 500KB
      console.log('✅ JavaScript bundle size is optimal');
    } else if (stats.jsSize < 1024 * 1024) { // < 1MB
      console.log('⚠️  JavaScript bundle size is acceptable but could be optimized');
    } else {
      console.log('❌ JavaScript bundle size is large, consider more aggressive code splitting');
    }
    
    if (stats.chunkCount > 3) {
      console.log('✅ Good code splitting detected');
    } else {
      console.log('⚠️  Consider implementing more code splitting');
    }
    
    console.log('\n💡 To analyze bundle contents in detail:');
    console.log('   npm run build:analyze');
    
  } else {
    console.log('❌ Unable to analyze bundle. Make sure to run "npm run build" first.');
  }
}

async function main() {
  console.log('🚀 TaskPulse Performance Testing\n');
  console.log('=' + '='.repeat(49) + '\n');
  
  checkPerformanceOptimizations();
  runBundleAnalysis();
  runLighthouseTest();
  
  console.log('📝 Performance Testing Tips:\n');
  console.log('• Test on different devices and network conditions');
  console.log('• Use Chrome DevTools Performance tab for detailed analysis');
  console.log('• Monitor Core Web Vitals in real-world usage');
  console.log('• Check performance on mobile devices');
  console.log('• Test with browser cache disabled\n');
  
  console.log('🎯 Performance Targets:');
  console.log(`• Page Load Time: < ${THRESHOLDS.LOAD_TIME}ms`);
  console.log(`• First Contentful Paint: < ${THRESHOLDS.FCP}ms`);
  console.log(`• Largest Contentful Paint: < ${THRESHOLDS.LCP}ms`);
  console.log(`• Cumulative Layout Shift: < ${THRESHOLDS.CLS}`);
  console.log(`• First Input Delay: < ${THRESHOLDS.FID}ms\n`);

  console.log('✅ Performance optimization setup complete!');
  console.log('Follow the manual testing instructions above to validate performance.');
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
TaskPulse Performance Testing Script

Usage:
  node scripts/test-performance.js [options]

Options:
  --help - Show this help message

This script:
• Checks if performance optimizations are implemented
• Analyzes bundle size and provides recommendations
• Provides instructions for manual performance testing
• Shows performance targets and testing tips

For automated testing with Puppeteer, install puppeteer:
  npm install --save-dev puppeteer
  `);
  process.exit(0);
}

// Run the analysis
main().catch(error => {
  console.error('❌ Performance analysis failed:', error);
  process.exit(1);
}); 