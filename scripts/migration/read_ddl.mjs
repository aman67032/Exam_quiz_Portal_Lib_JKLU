import fs from 'fs';

try {
    const content = fs.readFileSync('ddl.json', 'utf8');
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']') + 1;

    if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonStr = content.substring(jsonStart, jsonEnd);
        const data = JSON.parse(jsonStr);
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.error('Could not find JSON in file');
        console.log('Raw content snippet:', content.substring(0, 100));
    }
} catch (err) {
    console.error('Error:', err.message);
}
