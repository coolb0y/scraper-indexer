function getFileExtension(fileName) {
    if (typeof fileName !== 'string') {
        throw new Error('Input must be a string.');
    }

    // Extract the extension using a regular expression
    const match = fileName.match(/\.([a-zA-Z0-9]+)$/);

    // Return the extension in lowercase or null if no match
    return match ? match[1].toLowerCase() : null;
}

exports.getFileExtension = getFileExtension;