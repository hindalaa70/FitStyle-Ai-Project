import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { fetchAnalyzeProduct } from '../services/api';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Plus, Search, UploadCloud, X, Loader2, AlertCircle, CheckCircle, Edit2, Trash2, LayoutDashboard, ShoppingBag, LogOut } from 'lucide-react';

const CATEGORIES = ['All', 'Top', 'Bottom', 'Footwear', 'Accessory'];

const categoryClasses = {
  Top: 'bg-[#f6e7ff] text-[#8c3cff]',
  Bottom: 'bg-[#e8f3ff] text-[#2b63d6]',
  Footwear: 'bg-[#fff1e8] text-[#d96d1e]',
  Accessory: 'bg-[#ffe8f4] text-[#c53b83]',
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Top');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSizes, setProdSizes] = useState('S, M, L, XL');
  const [prodOccasions, setProdOccasions] = useState('Casual, Formal');
  const [prodShapes, setProdShapes] = useState('Hourglass, Rectangle, Pear, Apple, Inverted Triangle');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [discount, setDiscount] = useState('0');
  const [primaryColor, setPrimaryColor] = useState('');
  const [confidence, setConfidence] = useState('');

  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisError, setAnalysisError] = useState('');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState('');
  const [uploadedMimeType, setUploadedMimeType] = useState('image/jpeg');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  const lowStockCount = products.filter((product) => {
    const stock = Number(product.stock || 0);
    return stock > 0 && stock <= 5;
  }).length;

  const aiCatalogedCount = products.filter((product) => !!product.confidence).length;

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.occasion?.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const resetForm = () => {
    setProdName('');
    setProdCategory('Top');
    setProdPrice('');
    setProdSizes('S, M, L, XL');
    setProdOccasions('Casual, Formal');
    setProdShapes('Hourglass, Rectangle, Pear, Apple, Inverted Triangle');
    setProdImageUrl('');
    setStockQuantity('10');
    setDiscount('0');
    setPrimaryColor('');
    setConfidence('');
    setUploadedImagePreview('');
    setAnalysisError('');
    setAnalysisMessage('');
    setAnalysisStatus('idle');
  };

  const openNewProduct = () => {
    resetForm();
    setIsEditing(false);
    setEditId(null);
    setDrawerOpen(true);
  };

  const openEditProduct = (product) => {
    setIsEditing(true);
    setEditId(product.id);
    setProdName(product.name || '');
    setProdCategory(product.category || 'Top');
    setProdPrice(product.price ? String(product.price) : '');
    setProdSizes(Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes || '');
    setProdOccasions(Array.isArray(product.occasions) ? product.occasions.join(', ') : product.occasion || '');
    setProdShapes(Array.isArray(product.shapes) ? product.shapes.join(', ') : product.shapes || '');
    setProdImageUrl(product.imageUrl || '');
    setStockQuantity(product.stock ? String(product.stock) : '10');
    setDiscount(product.discount ? String(product.discount) : '0');
    setPrimaryColor(product.primary_color || '');
    setConfidence(product.confidence || '');
    setUploadedImagePreview(product.imageUrl || '');
    setAnalysisStatus('complete');
    setDrawerOpen(true);
  };

  const handleImageFile = (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAnalysisError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setAnalysisError('');
    setAnalysisStatus('processing');
    setAnalysisMessage('AI is analyzing the image...');
    setUploadedMimeType(file.type);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target?.result;
      if (typeof dataUri !== 'string') return;
      const base64 = dataUri.split(',')[1];
      setUploadedImagePreview(dataUri);

      try {
        const result = await fetchAnalyzeProduct(base64, file.type);
        if (!result.success || !result.data) {
          throw new Error(result.error || 'AI returned an empty response');
        }

        const data = result.data;
        setProdName(data.name || '');
        setProdCategory(data.category || 'Top');
        setProdPrice(data.price != null ? String(data.price) : '');
        setProdSizes(data.sizes || 'S, M, L, XL');
        setProdOccasions(data.occasions || 'Casual, Formal');
        setProdShapes(data.shapes || 'Hourglass, Rectangle, Pear');
        setPrimaryColor(data.primary_color || '');
        setConfidence(data.confidence || '');
        setAnalysisStatus('complete');
        setAnalysisMessage('AI analysis complete. Review the suggested values.');
      } catch (err) {
        setAnalysisStatus('failed');
        setAnalysisError(err?.message || 'AI analysis failed. Please fill fields manually.');
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) handleImageFile(droppedFile);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!prodName || !prodPrice) {
      setAnalysisError('Product name and suggested price are required.');
      return;
    }

    const payload = {
      name: prodName,
      category: prodCategory,
      price: parseFloat(prodPrice) || 0,
      sizes: prodSizes.split(',').map((item) => item.trim()).filter(Boolean),
      occasion: prodOccasions.split(',').map((item) => item.trim()).filter(Boolean)[0] || 'Casual',
      occasions: prodOccasions.split(',').map((item) => item.trim()).filter(Boolean),
      shapes: prodShapes.split(',').map((item) => item.trim()).filter(Boolean),
      imageUrl: uploadedImagePreview || prodImageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=60',
      stock: Number(stockQuantity) || 0,
      discount: Number(discount) || 0,
      primary_color: primaryColor,
      confidence,
    };

    try {
      if (isEditing && editId) {
        await updateDoc(doc(db, 'products', editId), payload);
      } else {
        await addDoc(collection(db, 'products'), payload);
      }
      setDrawerOpen(false);
      resetForm();
    } catch (error) {
      setAnalysisError(error.message || 'Failed to save product.');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      setAnalysisError(error.message || 'Unable to delete product.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf5ff] text-surface-text">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-72 flex-col border-r border-surface-border bg-white p-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-3xl bg-[#f5e0ff] flex items-center justify-center text-[#8c3cff] text-xl font-bold">F</div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-surface-muted">FitStyle AI</p>
                <h2 className="text-xl font-bold">Catalogue Manager</h2>
              </div>
            </div>

            <p className="text-sm text-surface-muted">Curated inventory insights and product intake for your fashion storefront.</p>
          </div>

          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-surface-muted mb-4">Collections</p>
            <ul className="space-y-2">
              {CATEGORIES.slice(1).map((category) => (
                <li key={category}>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left rounded-2xl px-4 py-3 transition ${selectedCategory === category ? 'bg-[#f3e5ff] text-[#8c3cff]' : 'text-surface-text hover:bg-surface-card'}`}>
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => navigate('/studio')} className="mb-3 w-full rounded-2xl border border-[#8c3cff] bg-white py-3 text-sm font-semibold text-[#8c3cff] transition hover:bg-[#f4e4ff]">Fit Studio</button>
          <button onClick={logout} className="w-full rounded-2xl border border-surface-border bg-surface-card py-3 text-sm font-semibold text-surface-text transition hover:bg-surface-bg">Sign Out</button>
        </aside>

        <main className="flex-1 p-6 xl:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#8c3cff] mb-2">FitStyle AI</p>
              <h1 className="text-4xl font-outfit font-bold">Inventory</h1>
              <p className="text-sm text-surface-muted mt-2">Manage and curate your high-fashion digital showroom.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 text-surface-muted" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search inventory..."
                  className="input-light w-full pl-10 pr-4 py-3"
                />
              </div>
              <button onClick={openNewProduct} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold">
                <Plus className="h-4 w-4" /> Add New Product
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 mb-8">
            <div className="light-card rounded-[2rem] p-6 shadow-sm border border-surface-border">
              <p className="text-xs uppercase tracking-[0.3em] text-surface-muted mb-4">Total Products</p>
              <h2 className="text-3xl font-bold">{products.length}</h2>
              <p className="text-sm text-surface-muted mt-2">A complete catalogue of all active garments.</p>
            </div>
            <div className="light-card rounded-[2rem] p-6 shadow-sm border border-surface-border">
              <p className="text-xs uppercase tracking-[0.3em] text-surface-muted mb-4">Low Stock Alerts</p>
              <h2 className="text-3xl font-bold">{lowStockCount}</h2>
              <p className="text-sm text-surface-muted mt-2">Items requiring immediate restock attention.</p>
            </div>
            <div className="light-card rounded-[2rem] p-6 shadow-sm border border-surface-border">
              <p className="text-xs uppercase tracking-[0.3em] text-surface-muted mb-4">AI Cataloged</p>
              <h2 className="text-3xl font-bold">{aiCatalogedCount}</h2>
              <p className="text-sm text-surface-muted mt-2">Products processed with AI attribute extraction.</p>
            </div>
          </div>

          <div className="light-card rounded-[2rem] border border-surface-border p-6 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Current Inventory</h2>
                <p className="text-sm text-surface-muted">Browse your stock and edit details inline.</p>
              </div>
              <div className="text-xs text-surface-muted">Showing {filteredProducts.length} items</div>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-surface-muted border-b border-surface-border">
                  <th className="p-4">Image</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Sizes</th>
                  <th className="p-4">Occasions</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-surface-border hover:bg-surface-card transition-colors">
                    <td className="p-4">
                      <img
                        src={product.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=60'}
                        alt={product.name}
                        className="h-20 w-20 rounded-3xl object-cover"
                      />
                    </td>
                    <td className="p-4 font-semibold">{product.name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${categoryClasses[product.category] || 'bg-surface-card text-surface-text'}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">${Number(product.price || 0).toFixed(2)}</td>
                    <td className="p-4">{Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes}</td>
                    <td className="p-4">{Array.isArray(product.occasions) ? product.occasions.join(', ') : product.occasion || '—'}</td>
                    <td className="p-4">
                      <div className="inline-flex gap-2">
                        <button onClick={() => openEditProduct(product)} className="rounded-2xl border border-surface-border px-3 py-2 text-surface-muted hover:text-[#8c3cff] transition">Edit</button>
                        <button onClick={() => handleDelete(product.id)} className="rounded-2xl border border-red-100 px-3 py-2 text-red-500 hover:bg-red-50 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/10 p-4 backdrop-blur-sm">
          <div className="relative h-full w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:w-[90%]">
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-surface-muted">Add Product Intake</p>
                <h2 className="text-2xl font-bold">AI Product Intake Terminal</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-full bg-surface-card p-3 text-surface-muted hover:text-surface-text transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col gap-6">
                <div className="rounded-[2rem] border border-dashed border-[#e8d6ff] bg-[#fcf4ff] p-8 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ede2ff] text-[#8c3cff]">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Product Imagery</h3>
                  <p className="text-sm text-surface-muted mb-6">Drag and drop high-resolution editorial shots here for instant attribute extraction.</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary px-6 py-3">
                    Select From Device
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} className="hidden" />
                </div>

                <div className="rounded-[2rem] border border-surface-border bg-surface-card p-6">
                  <p className="text-sm font-semibold mb-3">Upload preview</p>
                  {uploadedImagePreview ? (
                    <div className="rounded-[1.5rem] overflow-hidden border border-surface-border bg-white">
                      <img src={uploadedImagePreview} alt="upload preview" className="h-64 w-full object-contain" />
                    </div>
                  ) : (
                    <div className="rounded-[1.5rem] border border-surface-border bg-white p-6 text-center text-sm text-surface-muted">
                      No image selected yet.
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6 rounded-[2rem] border border-surface-border bg-[#fff7ff] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-surface-muted">AI Analysis Results</p>
                    {analysisStatus === 'complete' ? (
                      <p className="mt-1 text-sm text-[#37a66f]">Processing complete</p>
                    ) : analysisStatus === 'processing' ? (
                      <p className="mt-1 text-sm text-surface-muted">Analyzing image...</p>
                    ) : analysisStatus === 'failed' ? (
                      <p className="mt-1 text-sm text-red-500">AI analysis failed. Please fill fields manually.</p>
                    ) : (
                      <p className="mt-1 text-sm text-surface-muted">Upload an image to start AI extraction.</p>
                    )}
                  </div>
                  {analysisStatus === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-[#8c3cff]" />}
                </div>

                {analysisError && (
                  <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                    <AlertCircle className="inline h-4 w-4 mr-2 align-text-bottom" />
                    {analysisError}
                  </div>
                )}

                <div className="grid gap-4">
                  <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Product Name</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Silk Midi Dress"
                    className="input-light w-full py-3 px-4"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Category</label>
                    <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} className="input-light w-full py-3 px-4">
                      <option>Top</option>
                      <option>Bottom</option>
                      <option>Footwear</option>
                      <option>Accessory</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Primary Color</label>
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="e.g. Magenta Bloom"
                      className="input-light w-full py-3 px-4"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Suggested Price (AI)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      placeholder="$245"
                      className="input-light w-full py-3 px-4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Size Availability</label>
                    <input
                      type="text"
                      value={prodSizes}
                      onChange={(e) => setProdSizes(e.target.value)}
                      placeholder="XS, S, M, L"
                      className="input-light w-full py-3 px-4"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Fit Occasions</label>
                  <input
                    type="text"
                    value={prodOccasions}
                    onChange={(e) => setProdOccasions(e.target.value)}
                    placeholder="Casual, Formal"
                    className="input-light w-full py-3 px-4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Flattering Silhouettes</label>
                  <input
                    type="text"
                    value={prodShapes}
                    onChange={(e) => setProdShapes(e.target.value)}
                    placeholder="Hourglass, Rectangle"
                    className="input-light w-full py-3 px-4"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Stock Quantity</label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="input-light w-full py-3 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-surface-muted">Discount %</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="input-light w-full py-3 px-4"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm font-semibold">
                  Confirm and Add to Inventory
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
