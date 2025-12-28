import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description?: string;
  active: boolean;
}

interface Branch {
  id: string;
  name: string;
}

export function Products() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForDist, setSelectedProductForDist] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    description: ''
  });

  const [distData, setDistData] = useState({
      branchId: '',
      initialQty: '0'
  });

  useEffect(() => {
    fetchProducts();
    fetchBranches();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranches = async () => {
      try {
          const res = await api.get('/branches');
          setBranches(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setIsModalOpen(false);
      fetchProducts();
      resetForm();
    } catch (err) {
      alert('Error saving product');
      console.error(err);
    }
  };

  const handleDistribute = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProductForDist || !distData.branchId) return;

      try {
          // We need the SKU ID. The product object usually has skus array.
          // For MVP, assuming flattened or first SKU.
          // Let's check how GET /products returns data.
          // It returns: { ...product, skus: [...] }
          // We need to fetch the specific product details or rely on the list having skus
          // Actually, let's assume we map the first SKU of the product.
          
          // Wait, the listing uses the product ID. AdjustStock needs SKU ID.
          // Let's find the skuId from the product list data.
          const productDetail = products.find(p => p.id === selectedProductForDist.id) as any;
          if (!productDetail || !productDetail.skus || productDetail.skus.length === 0) {
              alert("Product has no SKUs");
              return;
          }
          const skuId = productDetail.skus[0].id;

          await api.post('/inventory/adjust', {
              skuId,
              branchId: distData.branchId,
              qtyChange: parseInt(distData.initialQty) || 0,
              reason: 'RESTOCK' 
          });
          
          // Actually reason enum validation might fail if I send 'INITIAL_STOCK'.
          // Let's use 'RESTOCK'.
          
          alert("Product distributed successfully");
          setIsDistributeOpen(false);
          setDistData({ branchId: '', initialQty: '0' });
      } catch (err: any) {
          alert('Error distributing product: ' + (err.response?.data?.message || err.message));
      }
  };

  const resetForm = () => {
    setFormData({ sku: '', name: '', price: '', description: '' });
    setEditingProduct(null);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku, // Note: SKU might be unique per product or per SKU entry. 
                       // The API expects 'sku' on create/update for the Product model itself?
                       // createProductSchema expects 'sku'.
      name: product.name,
      price: product.price.toString(),
      description: product.description || ''
    });
    setIsModalOpen(true);
  };
  
  const openDistribute = (product: Product) => {
      setSelectedProductForDist(product);
      setDistData({ branchId: branches[0]?.id || '', initialQty: '0' });
      setIsDistributeOpen(true);
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    return <div className="p-4">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4">Name</th>
              <th className="p-4">Reference / SKU</th>
              <th className="p-4">Price</th>
              <th className="p-4">Description</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 font-mono text-sm">{product.sku}</td>
                <td className="p-4">${product.price.toFixed(2)}</td>
                <td className="p-4 text-gray-500 text-sm max-w-xs truncate">{product.description}</td>
                <td className="p-4 space-x-2">
                  <button
                    onClick={() => openEdit(product)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDistribute(product)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Distribute
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference SKU</label>
                <input
                  type="text"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  disabled={!!editingProduct} // Usually SKUs shouldn't change easily
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border p-2 rounded"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Distribute Modal */}
      {isDistributeOpen && selectedProductForDist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Distribute Product
            </h2>
            <p className="mb-4 text-sm text-gray-600">
                Initialize stock for <strong>{selectedProductForDist.name}</strong> at a specific branch.
            </p>
            <form onSubmit={handleDistribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Branch</label>
                <select
                  required
                  className="w-full border p-2 rounded"
                  value={distData.branchId}
                  onChange={e => setDistData({...distData, branchId: e.target.value})}
                >
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Stock Qty</label>
                <input
                  type="number"
                  required
                  className="w-full border p-2 rounded"
                  value={distData.initialQty}
                  onChange={e => setDistData({...distData, initialQty: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDistributeOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Distribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
