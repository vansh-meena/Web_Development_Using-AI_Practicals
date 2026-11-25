require('dotenv').config();
const SwaggerParser = require('@apidevtools/swagger-parser');

async function main() {
  try {
    const api = await SwaggerParser.validate('docs/openapi.json');
    console.log(`OpenAPI spec is valid: ${api.info.title} v${api.info.version}`);
  } catch (err) {
    console.error('OpenAPI spec is INVALID:');
    console.error(err.message);
    process.exit(1);
  }
}

main();
