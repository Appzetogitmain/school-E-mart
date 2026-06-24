const mongoose = require('mongoose');

const localUri = 'mongodb://127.0.0.1:27017/school-emart';

async function test() {
  console.log('Attempting to connect to local MongoDB...');
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log('Success! Connected to local MongoDB!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

test();
