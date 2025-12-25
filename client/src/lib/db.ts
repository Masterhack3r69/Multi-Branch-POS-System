import { openDB, DBSchema } from 'idb';

interface POSDB extends DBSchema {
  products: {
    key: string;
    value: {
      id: string;
      name: string;
      price: number;
      skus: { id: string; barcode: string | null }[];
    };
  };
  sales: {
    key: string;
    value: {
      clientSaleId: string;
      branchId: string;
      terminalId: string;
      cashierId: string;
      items: any[];
      payments: any[];
      synced: boolean;
    };
  };
}

const dbPromise = openDB<POSDB>('pos-db', 1, {
  upgrade(db) {
    db.createObjectStore('products', { keyPath: 'id' });
    db.createObjectStore('sales', { keyPath: 'clientSaleId' });
  },
});

export const db = {
  async saveProducts(products: any[]) {
    const tx = (await dbPromise).transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    await Promise.all(products.map(p => store.put(p)));
    await tx.done;
  },

  async getProducts() {
    return (await dbPromise).getAll('products');
  },

  async queueSale(sale: any) {
    sale.synced = false;
    return (await dbPromise).put('sales', sale);
  },

  async getPendingSales() {
    const all = await (await dbPromise).getAll('sales');
    return all.filter(s => !s.synced);
  },
  
  async markSaleSynced(clientSaleId: string) {
    const db = await dbPromise;
    const sale = await db.get('sales', clientSaleId);
    if (sale) {
        sale.synced = true;
        await db.put('sales', sale);
    }
  }
};
