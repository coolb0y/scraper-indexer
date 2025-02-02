const fs = require('fs');
const xml2js = require('xml2js');

/**
 * Extract information from an SVG file.
 * @param {string} filePath - Path to the SVG file.
 * @returns {Promise<Object>} - Extracted SVG information.
 */
async function extractSvgInfo(filePath) {
    try {
        // Read the SVG file asynchronously
        const svgContent = await fs.promises.readFile(filePath, 'utf-8');

        // Parse the XML content
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(svgContent);

        const svg = result.svg || {};

        // Helper function to safely extract string content from objects
        const extractText = (field) => {
            if (!field) return "";  // Return empty string if field is missing
            return typeof field === "string" ? field : field._ || ""; // Extract text if it's an object
        };

        // Extract and ensure dimensions are numbers
        const parseDimension = (value) => {
            if (!value) return null; // Return null if missing
            const num = parseFloat(value);
            return isNaN(num) ? null : num; // Convert to number, return null if invalid
        };

        let width = parseDimension(svg.$?.width); 
        let height = parseDimension(svg.$?.height);
        let viewBox = svg.$?.viewBox || "";

        // Use viewBox values as a fallback if width/height are missing
        if (!width || !height) {
            const viewBoxValues = viewBox.split(' ').map(parseFloat);
            if (viewBoxValues.length === 4) {
                const [, , viewBoxWidth, viewBoxHeight] = viewBoxValues;
                width = width || viewBoxWidth;
                height = height || viewBoxHeight;
            }
        }

        // Ensure width and height have default values
        width = width ?? 100;
        height = height ?? 100;

        // Extract metadata, title, and description safely
        const metadata = svg.metadata || "";
        const title = extractText(svg.title?.[0]);
        const desc = extractText(svg.desc?.[0]);
        const artist = metadata?.[0]?.creator ? extractText(metadata[0].creator) : "";

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
