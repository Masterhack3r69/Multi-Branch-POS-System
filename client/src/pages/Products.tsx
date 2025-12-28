import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Product Management</h1>
        <Button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
        >
          Add Product
        </Button>
      </div>

      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Reference / SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-bold uppercase">{product.name}</TableCell>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell className="font-mono">${product.price.toFixed(2)}</TableCell>
                <TableCell className="text-zinc-500 text-sm max-w-xs truncate uppercase">{product.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(product)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDistribute(product)}
                    >
                        Distribute
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <h2 className="text-xl font-black uppercase mb-6">
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Product Name</label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Reference SKU</label>
                <Input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={e => setFormData({...formData, sku: e.target.value})}
                  disabled={!!editingProduct}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Description</label>
                <textarea
                  className="flex w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono transition-all min-h-[80px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-black mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Distribute Modal */}
      {isDistributeOpen && selectedProductForDist && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <h2 className="text-xl font-black uppercase mb-4">
              Distribute Product
            </h2>
            <p className="mb-6 text-sm font-mono text-zinc-600 border-b-2 border-black pb-4">
                Initialize stock for <strong className="uppercase text-black">{selectedProductForDist.name}</strong> at a specific branch.
            </p>
            <form onSubmit={handleDistribute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Target Branch</label>
                <select
                  required
                  className="flex h-10 w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  value={distData.branchId}
                  onChange={e => setDistData({...distData, branchId: e.target.value})}
                >
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Initial Stock Qty</label>
                <Input
                  type="number"
                  required
                  value={distData.initialQty}
                  onChange={e => setDistData({...distData, initialQty: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-black mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDistributeOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default" // Using default (Black) for consistency, or standard styles. Distribute is a positive action.
                >
                  Distribute
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
