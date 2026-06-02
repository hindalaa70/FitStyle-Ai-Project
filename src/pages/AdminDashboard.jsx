import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  collection, getDocs, doc, addDoc, 
  updateDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import { 
  Plus, Edit2, Trash2, Search, Tag, 
  Percent, Grid, Ruler, Image as ImageIcon, X 
} from 'lucide-react';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer/Modal States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('Add Product Intake');
  const [editProductId, setEditProductId] = useState(null);

  // Form Fields State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Top');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSizes, setProdSizes] = useState('S, M, L, XL');
  const [prodOccasions, setProdOccasions] = useState('Casual, Formal');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodShapes, setProdShapes] = useState('Hourglass, Rectangle, Pear, Apple, Inverted Triangle');

  // Load products list via Snapshot for instant syncing
  useEffect(() => {
    const productsRef = collection(db, 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
      setLoading(false);
    }, (error) => {
      console.error('[AdminDashboard] Firestore snapshot stream error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const openAddDrawer = () => {
    setDrawerTitle('Add Product Intake');
    setEditProductId(null);
    setProdName('');
    setProdCategory('Top');
    setProdPrice('');
    setProdSizes('S, M, L, XL');
    setProdOccasions('Casual, Formal');
    setProdImageUrl('');
    setProdShapes('Hourglass, Rectangle, Pear, Apple, Inverted Triangle');
    setDrawerOpen(true);
  };

  const openEditDrawer = (product) => {
    setDrawerTitle('Modify Product Details');
    setEditProductId(product.id);
    setProdName(product.name || '');
    setProdCategory(product.category || 'Top');
    setProdPrice(product.price || '');
    
    // Support formats: arrays or strings
    const sizesStr = Array.isArray(product.sizes) ? product.sizes.join(', ') : (product.sizes || '');
    const occasionsStr = Array.isArray(product.occasions) ? product.occasions.join(', ') : (product.occasion || '');
    const shapesStr = Array.isArray(product.shapes) ? product.shapes.join(', ') : (product.shapes || 'Hourglass, Rectangle, Pear, Apple, Inverted Triangle');
    
    setProdSizes(sizesStr);
    setProdOccasions(occasionsStr);
    setProdImageUrl(product.imageUrl || '');
    setProdShapes(shapesStr);
    
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      alert('Please fill in Name and Price.');
      return;
    }

    // Process lists: split comma values and clean whitespaces
    const sizesArray = prodSizes.split(',').map(s => s.trim()).filter(Boolean);
    const occasionsArray = prodOccasions.split(',').map(o => o.trim()).filter(Boolean);
    const shapesArray = prodShapes.split(',').map(s => s.trim()).filter(Boolean);
    
    // Choose primary occasion for singular matching field
    const primaryOccasion = occasionsArray[0] || 'Casual';

    const payload = {
      name: prodName,
      category: prodCategory,
      price: parseFloat(prodPrice),
      sizes: sizesArray,
      occasion: primaryOccasion,
      occasions: occasionsArray,
      shapes: shapesArray,
      imageUrl: prodImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=60' // placeholder
    };

    try {
      if (editProductId) {
        // Edit Mode
        const docRef = doc(db, 'products', editProductId);
        await updateDoc(docRef, payload);
        console.log(`[Admin] Product "${editProductId}" successfully modified.`);
      } else {
        // Add Mode
        const productsCol = collection(db, 'products');
        const docRef = await addDoc(productsCol, payload);
        console.log(`[Admin] Product listed successfully with ID: ${docRef.id}`);
      }
      setDrawerOpen(false);
    } catch (err) {
      console.error('[Admin] Firestore write operation failed:', err);
      alert('Error updating catalogue database.');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove "${name}" from inventory?`);
    if (!confirmDelete) return;

    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
      console.log(`[Admin] Product "${id}" successfully removed.`);
    } catch (err) {
      console.error('[Admin] Firestore delete failed:', err);
      alert('Error deleting product from database.');
    }
  };

  // Filter list by search terms
  const filteredProducts = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.occasion && p.occasion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col font-inter">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        
        {/* Statistics Panels Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
              <Tag className="h-6 w-6 text-gold" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-dark-muted tracking-wider block">Listed Inventory</span>
              <span className="text-2xl font-bold font-outfit text-white">{products.length} Items</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose/10 flex items-center justify-center border border-rose/20 shrink-0">
              <Percent className="h-6 w-6 text-rose" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-dark-muted tracking-wider block">Cloud Database Status</span>
              <span className="text-2xl font-bold font-outfit text-white">Firestore Connected</span>
            </div>
          </div>
        </div>

        {/* Search and CRUD Panel Container */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search garment name, occasion or category..."
                className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-2 pl-10 pr-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold transition-colors text-xs"
              />
            </div>

            <button
              onClick={openAddDrawer}
              className="bg-gold hover:bg-gold-hover text-black py-2.5 px-6 rounded-xl text-xs font-bold font-outfit flex items-center justify-center gap-1.5 transition-all shadow-md transform active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Garment</span>
            </button>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto rounded-xl border border-dark-border bg-dark-bg/40">
            {loading ? (
              <div className="text-center py-16 text-dark-muted font-inter text-xs flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mb-2"></div>
                <span>Syncing catalogue with Cloud Firestore...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-dark-muted font-inter text-sm">
                No garments found in database matching your search.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs text-dark-muted">
                <thead>
                  <tr className="bg-white/5 border-b border-dark-border text-white font-semibold font-outfit">
                    <th className="p-4 w-20">Thumb</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Fit Sizes</th>
                    <th className="p-4">Occasions</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 font-inter font-medium text-white">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <img 
                          src={prod.imageUrl} 
                          alt={prod.name} 
                          className="w-10 h-12 object-cover rounded-lg border border-dark-border bg-dark-bg"
                        />
                      </td>
                      <td className="p-4 font-outfit font-semibold text-sm max-w-xs truncate">
                        {prod.name}
                      </td>
                      <td className="p-4">
                        <span className="bg-rose-light text-rose border border-rose/15 py-0.5 px-2.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-4 text-dark-muted font-mono text-[10px]">
                        {Array.isArray(prod.sizes) ? prod.sizes.join(', ') : prod.sizes}
                      </td>
                      <td className="p-4">
                        <span className="text-gold font-bold">
                          {Array.isArray(prod.occasions) ? prod.occasions.join(', ') : (prod.occasion || 'Casual')}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-gold">
                        ${parseFloat(prod.price).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditDrawer(prod)}
                            title="Edit Item"
                            className="p-1.5 rounded-lg border border-dark-border text-dark-muted hover:text-white hover:bg-white/5 transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            title="Delete Item"
                            className="p-1.5 rounded-lg border border-rose/30 text-rose/70 hover:text-rose hover:bg-rose-light/15 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* --- ADD / EDIT PRODUCT SLIDE DRAWER --- */}
      {drawerOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            onClick={() => setDrawerOpen(false)} 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          ></div>

          {/* Drawer container */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-[#0e1013] border-l border-dark-border z-[60] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            {/* Header */}
            <div className="p-5 border-b border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-outfit font-bold text-white">
                {drawerTitle}
              </h3>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-dark-muted hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form list container */}
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-inter font-semibold">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Garment Name</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Silk-Blend Autumn Coat"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold font-medium"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Product Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold font-medium cursor-pointer"
                  >
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Retail Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="e.g. 89.99"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold font-medium"
                    required
                  />
                </div>

                {/* Sizes */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Available Sizes (Comma separated)</label>
                  <input
                    type="text"
                    value={prodSizes}
                    onChange={(e) => setProdSizes(e.target.value)}
                    placeholder="e.g. S, M, L, XL"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold font-medium"
                    required
                  />
                </div>

                {/* Occasions */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Fit Occasions (Comma separated)</label>
                  <input
                    type="text"
                    value={prodOccasions}
                    onChange={(e) => setProdOccasions(e.target.value)}
                    placeholder="e.g. Casual, Formal, Interview"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold font-medium"
                    required
                  />
                </div>

                {/* Shapes */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Flattering Silhouettes (Comma separated)</label>
                  <input
                    type="text"
                    value={prodShapes}
                    onChange={(e) => setProdShapes(e.target.value)}
                    placeholder="e.g. Hourglass, Rectangle, Pear"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold font-medium"
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-dark-muted uppercase tracking-wider block">Image URL</label>
                  <input
                    type="url"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 px-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold font-medium"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-hover text-black py-3 px-4 rounded-xl font-bold font-outfit text-sm shadow-lg transition-all transform active:scale-95 mt-4"
                >
                  {editProductId ? 'Save Product Changes' : 'List Product to Catalogue'}
                </button>

              </form>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default AdminDashboard;
