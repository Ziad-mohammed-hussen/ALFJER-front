const fs = require('fs');

const extractConfig = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/tailwind\.config = (\{[\s\S]*?\});?\s*<\/script>/);
  if (!match) return null;
  
  // Use eval to parse the JS object string into a real object
  let config;
  eval('config = ' + match[1]);
  return config;
};

const darkConfig = extractConfig('../stitch_academy_erp_management_suite/admin_dashboard_dark_mode/code.html');
const lightConfig = extractConfig('../stitch_academy_erp_management_suite/admin_dashboard_light_mode/code.html');

if (!darkConfig || !lightConfig) {
  console.log('Failed to extract configs');
  process.exit(1);
}

const darkColors = darkConfig.theme.extend.colors;
const lightColors = lightConfig.theme.extend.colors;

let cssContent = `:root {\n`;
for (const [key, value] of Object.entries(lightColors)) {
  cssContent += `  --color-${key}: ${value};\n`;
}
cssContent += `}\n\n`;

cssContent += `.dark {\n`;
for (const [key, value] of Object.entries(darkColors)) {
  cssContent += `  --color-${key}: ${value};\n`;
}
cssContent += `}\n`;

fs.writeFileSync('generated_theme.css', cssContent);

let tailwindColors = {};
for (const key of Object.keys(lightColors)) {
  tailwindColors[key] = `var(--color-${key})`;
}

fs.writeFileSync('generated_tailwind_colors.json', JSON.stringify(tailwindColors, null, 2));

console.log('Success');
