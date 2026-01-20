
const fs = require('fs');
const path = require('path');

const svgPath = path.join(process.cwd(), 'src/assets/doodle_pattern.svg');

try {
    const content = fs.readFileSync(svgPath, 'utf8');
    console.log('Total length:', content.length);
    console.log('First 100 chars:', content.substring(0, 100));

    if (content.includes('data:image/')) {
        console.log('Contains embedded image data.');
        const match = content.match(/data:image\/([a-zA-Z]+);base64,/);
        if (match) {
            console.log('Embedded Type:', match[1]);
        }
    } else {
        console.log('No embedded image data found.');
    }

} catch (err) {
    console.error('Error reading file:', err);
}
