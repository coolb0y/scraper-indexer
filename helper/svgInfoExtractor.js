const fs = require('fs');
const xml2js = require('xml2js');

/**
 * Extract information from an SVG file.
 * @param {string} filePath - Path to the SVG file.
 * @returns {Promise<Object>} - Extracted SVG information.
 */
async function extractSvgInfo(filePath) {
    try {
        // Read the SVG file
        const svgContent = fs.readFileSync(filePath, 'utf-8');

        // Parse the XML content
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(svgContent);

        const svg = result.svg || {};

        // Extract dimensions
        const width = svg.$?.width || null;
        const height = svg.$?.height || null;
        const viewBox = svg.$?.viewBox || null;

        // Extract metadata
        const metadata = svg.metadata || null;

        // Extract title and description (if available)
        const title = svg.title?.[0] || null;
        const desc = svg.desc?.[0] || null;

        // Extract artist or creator information
        const artist = metadata?.[0]?.creator || null;

        return {
            dimensions: { width, height, viewBox },
            title,
            description: desc,
            artist,
            rawMetadata: metadata,
        };
    } catch (error) {
        console.error('Error parsing SVG:', error.message);
        throw error;
    }
}

module.exports = { extractSvgInfo };
