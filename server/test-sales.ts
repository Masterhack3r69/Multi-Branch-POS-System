import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
let token = '';
let branchId = '';
let terminalId = '';
let cashierId = '';
let skuId = '';

async function run() {
  try {
    console.log('--- Starting Test ---');

    // 1. Login
    console.log('1. Logging in...');
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'password123'
        });
        token = loginRes.data.token;
        cashierId = loginRes.data.user.id;
        console.log('Logged in, token:', token.substring(0, 10) + '...');
    } catch (e: any) {
        console.error('Login failed:', e.message);
        if (e.response) console.error(e.response.data);
        throw e;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Get Branch
    console.log('2. Fetching branches...');
    const branchesRes = await axios.get(`${API_URL}/branches`, { headers });
    if (branchesRes.data.length === 0) throw new Error('No branches found');
    branchId = branchesRes.data[0].id;
    console.log('Branch ID:', branchId);

    // 3. Get Terminal
    console.log('3. Fetching terminals...');
    const terminalsRes = await axios.get(`${API_URL}/branches/${branchId}/terminals`, { headers });
    if (terminalsRes.data.length === 0) throw new Error('No terminals found');
    terminalId = terminalsRes.data[0].id;
    console.log('Terminal ID:', terminalId);

    // 4. Get Product/SKU
    console.log('4. Fetching products...');
    const productsRes = await axios.get(`${API_URL}/products`, { headers });
    if (productsRes.data.length === 0) throw new Error('No products found');
    skuId = productsRes.data[0].skus[0].id;
    const price = productsRes.data[0].price;
    console.log('SKU ID:', skuId, 'Price:', price);

    // 5. Create Sale
    console.log('5. Creating Sale...');
    const saleData = {
      branchId,
      terminalId,
      cashierId,
      items: [
        { skuId, qty: 1, price: price }
      ],
      payments: [
        { method: 'CASH', amount: price * 1.1 } // Including tax
      ]
    };

    try {
        const saleRes = await axios.post(`${API_URL}/sales`, saleData, { headers });
        console.log('Sale created! ID:', saleRes.data.id);
        console.log('Sale Total:', saleRes.data.total);
    } catch (e: any) {
        console.error('Sale creation failed:', e.message);
        if (e.response) console.error(e.response.data);
        throw e;
    }

    console.log('--- Test Passed ---');

  } catch (error: any) {
    console.error('Test Failed:', error.message);
  }
}

run();
