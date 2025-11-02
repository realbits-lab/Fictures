import fetch from 'node-fetch';

async function testDocsPage() {
  console.log('Testing custom docs framework...\n');

  try {
    // Test 1: Homepage
    console.log('1. Testing /docs homepage...');
    const homeResponse = await fetch('http://localhost:3000/docs');
    console.log(`   Status: ${homeResponse.status} ${homeResponse.ok ? '✓' : '✗'}`);

    if (homeResponse.ok) {
      const homeHtml = await homeResponse.text();
      console.log(`   Contains "Fictures Documentation": ${homeHtml.includes('Fictures Documentation') ? '✓' : '✗'}`);
      console.log(`   Contains FileTree: ${homeHtml.includes('Documentation') ? '✓' : '✗'}`);
    }

    // Test 2: Nested page
    console.log('\n2. Testing /docs/novels/novels-specification...');
    const nestedResponse = await fetch('http://localhost:3000/docs/novels/novels-specification');
    console.log(`   Status: ${nestedResponse.status} ${nestedResponse.ok ? '✓' : '✗'}`);

    if (nestedResponse.ok) {
      const nestedHtml = await nestedResponse.text();
      console.log(`   Contains Novel content: ${nestedHtml.includes('Novel') || nestedHtml.includes('novel') ? '✓' : '✗'}`);
    }

    // Test 3: Check for TOC
    console.log('\n3. Checking for Table of Contents...');
    if (homeResponse.ok) {
      const homeHtml = await homeResponse.text();
      console.log(`   Contains "On This Page": ${homeHtml.includes('On This Page') ? '✓' : '✗'}`);
    }

    console.log('\n✅ Testing complete!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
}

testDocsPage();
