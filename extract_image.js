
import fs from 'fs';
import path from 'path';

const svgPath = path.join(process.cwd(), 'src/assets/doodle_pattern.svg');
const outputPath = path.join(process.cwd(), 'src/assets/doodle_pattern_opt.png');

try {
    let content = fs.readFileSync(svgPath, 'utf8');

    // Look for the base64 data
    const regex = /data:image\/[a-zA-Z]+;base64,([^"']+)/;
    const match = content.match(regex);

    if (match && match[1]) {
        console.log('Found embedded image data. Extracting...');
        const buffer = Buffer.from(match[1], 'base64');
        fs.writeFileSync(outputPath, buffer);
        console.log('Saved optimized PNG to:', outputPath);
        console.log('Original size (SVG):', content.length);
        console.log('New size (PNG):', buffer.length);
    } else {
        console.log('No embedded base64 image found in the SVG.');
    }

} catch (err) {
    console.error('Error:', err);
}
