import { exec } from 'child_process';

console.log('🚀 Opening story generator in browser...');
console.log('📝 Navigate to the story creation page to generate a new story');

// Open the story creation page in the default browser
exec('open http://localhost:3000/stories', (error) => {
  if (error) {
    console.error('❌ Failed to open browser:', error);
    console.log('🔗 Please manually navigate to: http://localhost:3000/stories');
  } else {
    console.log('✅ Browser opened successfully');
    console.log('📖 Click "Create New Story" to start the generation process');
  }
});

// Also show the direct generation URL
console.log('');
console.log('📚 Available URLs:');
console.log('🏠 Dashboard: http://localhost:3000/stories');
console.log('➕ Create Story: http://localhost:3000/stories (click Create New Story button)');
console.log('📖 Browse Stories: http://localhost:3000/browse');
console.log('');
console.log('💡 Suggested story prompt for testing:');
console.log('---');
console.log('Write a cyberpunk thriller about a data detective who discovers that their memories have been hacked and replaced with false ones. As they investigate their own past, they uncover a conspiracy involving memory trading on the black market. The protagonist must navigate between what\'s real and what\'s been implanted while being hunted by those who want to keep the truth buried.');
console.log('---');