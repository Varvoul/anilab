 // .eleventy.js
const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
    // 1. Copy Static Assets
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/images");
    eleventyConfig.addPassthroughCopy("src/assets");

   // 2. Improved Slugify Filter with duplicate prevention
    eleventyConfig.addFilter("slugify", function(str) {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    });

    // 3. Unique Slug Filter for posts (prevents duplicates)
    eleventyConfig.addFilter("uniqueSlug", function(post) {
        if (!post) return '';
        
        // Priority 1: Use post.id if available
        if (post.id) {
            return post.id
                .toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
        }
        
        // Priority 2: Use post.slug if available
        if (post.slug) {
            return post.slug;
        }
        
        // Priority 3: Slugify title with counter for duplicates
        const baseSlug = eleventyConfig.getFilter("slugify")(post.title || 'untitled');
        
        if (slugCache[baseSlug]) {
            slugCache[baseSlug] += 1;
            return `${baseSlug}-${slugCache[baseSlug]}`;
        } else {
            slugCache[baseSlug] = 1;
            return baseSlug;
        }
  });

    // 4. DATA FILTERS
    eleventyConfig.addFilter("getHero", function(posts) {
        const arr = ensureArray(posts);
        const featured = arr.filter(item => item.featured === true);
        if (featured.length > 0) return featured.slice(0, 5);
        return arr.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5);
    });

    eleventyConfig.addFilter("getTopAiring", function(posts) {
        const arr = ensureArray(posts);
        return arr
            .filter(item => item.status === "ongoing" || item.status === "upcoming")
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 20);
    });

    eleventyConfig.addFilter("filterByType", function(posts, type) {
        const arr = ensureArray(posts);
        return arr.filter(item => item.type === type);
    });

    eleventyConfig.addFilter("sortLatest", function(posts) {
        const arr = ensureArray(posts);
        return arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    });

    // NEW: Added missing filter used in index.njk
    eleventyConfig.addFilter("sortByRating", function(posts) {
        const arr = ensureArray(posts);
        return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    });

    eleventyConfig.addFilter("getRecommended", function(posts) {
        const arr = ensureArray(posts);
        return arr
            .map(item => ({
                ...item,
                recScore: (item.rating || 0) * 10 + (item.popularity || 0)
            }))
            .sort((a, b) => b.recScore - a.recScore)
            .slice(0, 20);
    });

    eleventyConfig.addFilter("truncate", function(str, length = 200) {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + '...';
    });

    eleventyConfig.addFilter("json", function(obj) {
        return JSON.stringify(obj);
    });

    // NEW: dump filter for JavaScript contexts (required for post-details.njk)
    eleventyConfig.addFilter("dump", function(obj) {
        return JSON.stringify(obj);
    });

    // NEW: Season filters for post-details.njk
    eleventyConfig.addFilter("getSeasonData", function(posts, currentTitle, seasonNumber) {
        const arr = ensureArray(posts);
        const seasonPost = arr.find(post => {
            const postTitle = post.title.toLowerCase();
            const searchTitle = currentTitle.toLowerCase();
            return (postTitle.includes(searchTitle) && 
                    postTitle.includes(`season ${seasonNumber}`)) ||
                   (post.seasonNumber === seasonNumber && postTitle.includes(searchTitle));
        });
        
        return seasonPost || {
            title: `${currentTitle} - Season ${seasonNumber}`,
            year: "N/A",
            episodes: 0,
            rating: "N/A",
            slug: `${currentTitle.toLowerCase().replace(/\s+/g, '-')}-season-${seasonNumber}`
        };
    });

    eleventyConfig.addFilter("getSeasonSlug", function(posts, currentTitle, seasonNumber) {
        const arr = ensureArray(posts);
        const seasonPost = arr.find(post => {
            const postTitle = post.title.toLowerCase();
            const searchTitle = currentTitle.toLowerCase();
            return (postTitle.includes(searchTitle) && 
                    postTitle.includes(`season ${seasonNumber}`)) ||
                   (post.seasonNumber === seasonNumber && postTitle.includes(searchTitle));
        });
        
        if (seasonPost) {
            return this.slugify(seasonPost.title);
        }
        
        return this.slugify(`${currentTitle} Season ${seasonNumber}`);
    });

    // 5. HELPER FUNCTION: Always returns array
    function ensureArray(data) {
        if (Array.isArray(data)) return data;
        if (data && data.posts && Array.isArray(data.posts)) return data.posts;
        if (data && typeof data === 'object') return Object.values(data);
        return [];
    }

    // 6. DATA LOADER (Handles both array and nested formats)
    const loadPostsData = () => {
        try {
            const postsPath = path.join(__dirname, 'src/_data/posts.json');
            if (!fs.existsSync(postsPath)) return [];
            
            const rawData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
            
            // Handle both formats: array OR {posts: [...]}
            let postsArray = [];
            if (Array.isArray(rawData)) {
                postsArray = rawData;
            } else if (rawData && rawData.posts && Array.isArray(rawData.posts)) {
                postsArray = rawData.posts;
            } else if (rawData && typeof rawData === 'object') {
                // Try to extract array from object
                const values = Object.values(rawData);
                if (values.length > 0 && Array.isArray(values[0])) {
                    postsArray = values[0];
                }
            }
            
            // Add computed fields
            return postsArray.map(item => ({
                ...item,
                slug: item.slug || item.title ? 
                    item.title.toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\-]+/g, '') : 
                    'untitled',
                watchLink: `/watch/${item.title ? 
                    item.title.toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\-]+/g, '') : 
                    'untitled'}/`
            }));
        } catch (error) {
            console.error('Error loading posts.json:', error);
            return [];
        }
    };

    // 7. GLOBAL DATA - ALWAYS returns array
    eleventyConfig.addGlobalData("posts", () => {
        const data = loadPostsData();
        // Always return array for templates
        return Array.isArray(data) ? data : [];
    });

    // 8. COLLECTIONS
    eleventyConfig.addCollection("popularShows", () => {
        const data = loadPostsData();
        const arr = ensureArray(data);
        return arr.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
    });

    eleventyConfig.addCollection("recommendedShows", () => {
        const data = loadPostsData();
        const arr = ensureArray(data);
        return arr
            .map(item => ({
                ...item,
                recScore: (item.rating || 0) * 10 + (item.popularity || 0)
            }))
            .sort((a, b) => b.recScore - a.recScore)
            .slice(0, 9);
    });

    eleventyConfig.addCollection("allPosts", () => {
        const data = loadPostsData();
        return ensureArray(data);
    });

    // 9. SEARCH DATA ENDPOINT
    eleventyConfig.addPassthroughCopy({
        "src/search-data.json.njk": "search-data.json"
    });

    // 10. Shortcode for current year
    eleventyConfig.addShortcode("currentYear", () => {
        return new Date().getFullYear().toString();
    });

    // 11. Nunjucks async filter support
    eleventyConfig.addNunjucksAsyncFilter("asyncFilter", async function() {
        // Placeholder for async filters if needed
        return Promise.resolve();
    });

    // 12. WATCH FOR CHANGES
    eleventyConfig.setWatchThrottleWaitTime(100); // ms

    // 13. BrowserSync configuration (optional)
    eleventyConfig.setBrowserSyncConfig({
        notify: false,
        open: true,
        ui: false
    });

    // 14. BUILD SETTINGS
    return {
        dir: {
            input: "src",
            includes: "_includes",
            layouts: "_includes",
            output: "_site",
            data: "_data"
        },
        templateFormats: ["njk", "md", "html", "json"],
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
        passthroughFileCopy: true
    };
};