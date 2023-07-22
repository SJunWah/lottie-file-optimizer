const fs = require('fs');
const sharp = require('sharp');

// Function to convert base64 image to base64 WebP
async function convertImageToWebp(base64image) {
    try {
        // Decode the base64 Image into a Buffer
        const imageBuffer = Buffer.from(base64image, 'base64');
        // Use sharp to convert the Image Buffer to WebP Buffer
        const webpBuffer = await sharp(imageBuffer, { failOn: "none" }).toFormat('webp').toBuffer();
        // Encode the WebP Buffer to base64
        const base64Webp = webpBuffer.toString('base64');
        return base64Webp;
    } catch (error) {
        throw error;
    }
}

function getImageFormatFromDataURI(dataURI) {
    // Use a regular expression to extract the image format from the data URI
    const regex = /^data:image\/(png|jpeg|gif|TIFF);base64,/;
    const match = dataURI.match(regex);

    // Check if there's a match and extract the image format
    if (match && match[1]) {
        return match[1];
    } else {
        // If no match is found or the format is not supported, return null or handle the error accordingly
        return null;
    }
}

// Function to process the Lottie JSON and convert images
async function processLottieJson(filename, inputFilePath, outputFilePath) {
    try {
        const supportedFormats = ['png', 'jpeg', 'gif', 'TIFF'];

        // Read the input Lottie JSON file
        const jsonData = JSON.parse(fs.readFileSync(`${inputFilePath}/${filename}`, 'utf8'));

        // Extract assets from the JSON
        const assets = jsonData.assets || [];

        const assetTF = jsonData.op;
        // Convert base64 PNG to base64 WebP for each asset
        await Promise.all(
            assets.map(async (asset, index) => {
                if (!asset.p)
                    return;
                if (asset.p && asset.p.indexOf('data:image') === 0) {
                    if (supportedFormats.includes(getImageFormatFromDataURI(asset.p))) {
                        const base64Data = asset.p.split(',')[1]
                        const base64Webp = await convertImageToWebp(base64Data);
                        asset.p = `data:image/webp;base64,${base64Webp}`;
                    }
                }
            })
        );

        // Write the updated JSON to a new file
        fs.writeFileSync(`${outputFilePath}/${filename}`, JSON.stringify(jsonData, null, 2), 'utf8');

        console.log(`${filename} conversion complete. Output saved to ${outputFilePath}/${filename}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

const inputFilePath = './inputs/';
const outputFilePath = './outputs/';

function init(){
fs.readdir(inputFilePath, (err, files) => {
    files.forEach(file => {
        processLottieJson(file, inputFilePath, outputFilePath);
    });
});
}

init();

