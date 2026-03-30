import axios from 'axios';

async function test() {
  try {
    const response = await axios.get(
      'http://localhost:3030/api/posts?city=&type=&bedroom=&minPrice=&maxPrice='
    );
    console.log('Response status:', response.status);
    console.log('Response data type:', typeof response.data);
    console.log('Is Array:', Array.isArray(response.data));
    console.log('Data Length:', response.data.length);
    console.log('First 2 items:', JSON.stringify(response.data.slice(0, 2), null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

test();
