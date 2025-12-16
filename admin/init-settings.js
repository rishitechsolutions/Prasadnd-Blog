// Script to initialize settings from existing website files
const fs = require('fs');
const path = require('path');
const { dbHelpers } = require('./database');

async function initSettings() {
    try {
        // Read index.html to extract current values
        const indexPath = path.join(__dirname, '..', 'index.html');
        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        // Extract logo URL - try multiple patterns
        let logoUrl = 'assets/logo.jpg';
        const logoPatterns = [
            /<img[^>]*src=["']([^"']*logo[^"']*)["'][^>]*class=["'][^"']*nav-logo/,
            /<img[^>]*class=["'][^"']*nav-logo[^"']*["'][^>]*src=["']([^"']*logo[^"']*)["']/,
            /nav-logo-box[^>]*>[\s\S]*?<img[^>]*src=["']([^"']*logo[^"']*)["']/
        ];
        
        for (const pattern of logoPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                logoUrl = match[1];
                break;
            }
        }
        
        // Extract profile picture URL - try multiple patterns
        let profileUrl = 'assets/profile pic.jpg';
        const profilePatterns = [
            /<img[^>]*src=["']([^"']*profile[^"']*)["'][^>]*class=["'][^"']*hero-profile/,
            /<img[^>]*class=["'][^"']*hero-profile[^"']*["'][^>]*src=["']([^"']*profile[^"']*)["']/,
            /hero-profile-image[^>]*src=["']([^"']*profile[^"']*)["']/
        ];
        
        for (const pattern of profilePatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                profileUrl = match[1];
                break;
            }
        }
        
        // Extract social links from sidebar
        const socialLinks = [];
        const sidebarSection = htmlContent.match(/<div class="social-icons">([\s\S]*?)<\/div>/);
        
        if (sidebarSection) {
            const socialIconsHtml = sidebarSection[1];
            const socialIconRegex = /<a[^>]*class=["'][^"']*social-icon[^"']*["'][^>]*aria-label=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/g;
            let match;
            let order = 0;
            
            while ((match = socialIconRegex.exec(socialIconsHtml)) !== null) {
                const platform = match[1];
                const url = match[2] || '#';
                
                socialLinks.push({
                    platform: platform,
                    url: url,
                    icon: '', // Will be auto-generated
                    display_order: order++
                });
            }
        }
        
        // If no social links found, add defaults
        if (socialLinks.length === 0) {
            socialLinks.push(
                { platform: 'Facebook', url: '#', icon: '', display_order: 0 },
                { platform: 'Instagram', url: '#', icon: '', display_order: 1 },
                { platform: 'LinkedIn', url: '#', icon: '', display_order: 2 },
                { platform: 'Twitter', url: '#', icon: '', display_order: 3 }
            );
        }
        
        // Save to database (only if not already set, to preserve admin changes)
        const existingLogo = await dbHelpers.getSetting('logo_url');
        if (!existingLogo) {
            await dbHelpers.setSetting('logo_url', logoUrl);
        } else {
            logoUrl = existingLogo; // Use existing if set
        }
        
        const existingProfile = await dbHelpers.getSetting('profile_picture_url');
        if (!existingProfile) {
            await dbHelpers.setSetting('profile_picture_url', profileUrl);
        } else {
            profileUrl = existingProfile; // Use existing if set
        }
        
        // Only add social links if none exist
        const existingLinks = await dbHelpers.getAllSocialLinks();
        if (existingLinks.length === 0 && socialLinks.length > 0) {
            for (const link of socialLinks) {
                await dbHelpers.createSocialLink(link);
            }
        } else if (existingLinks.length > 0) {
            // Use existing links
            socialLinks.length = 0;
            socialLinks.push(...existingLinks);
        }
        
        return {
            logo: logoUrl,
            profile: profileUrl,
            socialLinks: socialLinks.length
        };
        
    } catch (error) {
        console.error('Error initializing settings:', error);
        // Return defaults on error
        return {
            logo: 'assets/logo.jpg',
            profile: 'assets/profile pic.jpg',
            socialLinks: 0
        };
    }
}

// Run if called directly
if (require.main === module) {
    initSettings().then(() => {
        console.log('\n✨ Settings initialization complete!');
        process.exit(0);
    });
}

module.exports = { initSettings };

