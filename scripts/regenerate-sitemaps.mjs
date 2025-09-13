#!/usr/bin/env node

/**
 * Script to check and validate all sitemaps
 * This can be run as a health check to ensure sitemaps are working
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://sky.coflnet.com';
const SITEMAP_URLS = [
    '/sitemap.xml',
    '/sitemap-index.xml', 
    '/sitemap-pages.xml',
    '/sitemap-items.xml',
    '/sitemap-bazaar.xml'
];

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function fetchSitemap(url) {
    try {
        const response = await fetch(`${BASE_URL}${url}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        log(`Failed to fetch ${url}: ${error.message}`, colors.red);
        throw error;
    }
}

function validateSitemap(sitemap, url) {
    // Basic XML validation
    if (!sitemap.includes('<?xml') || (!sitemap.includes('<urlset') && !sitemap.includes('<sitemapindex'))) {
        log(`Invalid XML format for ${url}`, colors.red);
        return false;
    }
    
    // Check for URLs
    const urlCount = countUrls(sitemap);
    if (urlCount === 0) {
        log(`No URLs found in ${url}`, colors.yellow);
        return false;
    }
    
    log(`${url}: ${urlCount} URLs found`, colors.green);
    return true;
}

function countUrls(sitemap) {
    const urlMatches = sitemap.match(/<url>/g);
    const sitemapMatches = sitemap.match(/<sitemap>/g);
    return (urlMatches ? urlMatches.length : 0) + (sitemapMatches ? sitemapMatches.length : 0);
}

async function checkSitemaps() {
    log('🚀 Starting sitemap validation...', colors.blue);
    
    const results = await Promise.allSettled(
        SITEMAP_URLS.map(async (url) => {
            log(`Fetching ${url}...`, colors.blue);
            const sitemap = await fetchSitemap(url);
            const isValid = validateSitemap(sitemap, url);
            return { url, isValid, size: sitemap.length };
        })
    );
    
    log('\n=== Sitemap Validation Results ===', colors.blue);
    
    let successCount = 0;
    
    results.forEach((result, index) => {
        const url = SITEMAP_URLS[index];
        
        if (result.status === 'fulfilled') {
            const { isValid, size } = result.value;
            if (isValid) {
                successCount++;
                log(`✓ ${url}: ${Math.round(size / 1024)}KB`, colors.green);
            } else {
                log(`✗ ${url}: Validation failed`, colors.red);
            }
        } else {
            log(`✗ ${url}: ${result.reason.message}`, colors.red);
        }
    });
    
    log(`\nSummary: ${successCount}/${SITEMAP_URLS.length} sitemaps are valid`, 
        successCount === SITEMAP_URLS.length ? colors.green : colors.yellow);
    
    if (successCount === SITEMAP_URLS.length) {
        log('All sitemaps are working correctly! 🎉', colors.green);
    } else {
        log('Some sitemaps failed validation. Please check the errors above.', colors.red);
        process.exit(1);
    }
}

// Run the script
checkSitemaps().catch((error) => {
    log(`Fatal error: ${error.message}`, colors.red);
    process.exit(1);
});
