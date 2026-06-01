/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Product, AdminSettings, CatalogType } from '../types';
import { isSupabaseConfigured, SUPABASE_SQL_SETUP, supabase } from '../lib/supabase';
import { 
  Lock, 
  Unlock, 
  Trash2, 
  Edit3, 
  Plus, 
  RotateCcw, 
  Download, 
  Upload, 
  X, 
  Check, 
  Save, 
  FileText, 
  Phone,
  HelpCircle,
  Database,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  resetToDefault: () => void;
  onClose: () => void;
}

export default function AdminPanel({
  products,
  setProducts,
  settings,
  setSettings,
  resetToDefault,
  onClose
}: AdminPanelProps) {
  const formRef = useRef<HTMLDivElement>(null);
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<string>('');

  // CRUD & Editing states
  const [activeTab, setActiveTab] = useState<'Natura' | 'O Boticario' | 'Croche' | 'Config'>('Natura');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Form states for adding/editing
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'indexNum'>>({
    catalog: 'Natura',
    title: '',
    description: '',
    badge: '',
    price: '',
    promotionalPrice: '',
    notes: '',
    imageUrl: 'perfume_gold_tall',
    whatsappLink: ''
  });

  const [importJson, setImportJson] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@leidy.com',
        password: password
      });
      if (error) {
        setLoginError('Senha ou usuário incorretos. Tente novamente.');
      } else {
        setIsAuthenticated(true);
        setLoginError('');
      }
    } else {
      if (password === 'leidypremium') {
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Senha de segurança inválida no modo offline.');
      }
    }
  };

  // Helper to trigger save action
  const logAction = (msg: string) => {
    console.log(`[CMS Admin Action] ${msg}`);
  };

  // Handle Delete Product
  const handleDelete = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    // Recalculate index numbers so indexing is sequential e.g., "01/14", "02/14" etc.
    const reindexed = updated.map((p, idx) => {
      const idxStr = String(idx + 1).padStart(2, '0');
      const totalStr = String(updated.length).padStart(2, '0');
      return {
        ...p,
        indexNum: `${idxStr}/${totalStr}`
      };
    });
    setProducts(reindexed);
    logAction(`Deletou o produto ID: ${id}. Reindexado para ${reindexed.length} itens.`);
  };

  // Handle uploading product image file converting to Base64 data Uri or Supabase Storage
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { error } = await supabase.storage.from('lady_bucket').upload(filePath, file);
      if (error) {
        alert('Erro ao enviar imagem: ' + error.message);
        return;
      }
      const { data } = supabase.storage.from('lady_bucket').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, imageUrl: data.publicUrl }));
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({
            ...prev,
            imageUrl: event.target.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Switch edit or create
  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      catalog: p.catalog,
      title: p.title,
      description: p.description,
      badge: p.badge,
      price: p.price,
      promotionalPrice: p.promotionalPrice || '',
      notes: p.notes,
      imageUrl: p.imageUrl,
      whatsappLink: p.whatsappLink
    });
    setIsAddingNew(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const startAdd = (catalog: CatalogType) => {
    setIsAddingNew(true);
    setEditingProduct(null);
    setFormData({
      catalog,
      title: '',
      description: '',
      badge: catalog === 'Croche' ? 'LEIDY CROCHÊ PREMIUM' : `NATURA EXCLUSIF`,
      price: 'R$ ',
      promotionalPrice: '',
      notes: catalog === 'Croche' ? 'Dimensões: | Fio Algodão' : 'Notas olfativas principais:',
      imageUrl: catalog === 'Croche' ? 'crochet_mandala' : 'perfume_gold_tall',
      whatsappLink: ''
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Save changes
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let updatedProducts = [...products];

    if (isAddingNew) {
      const newId = `custom_${Date.now()}`;
      // Format basic whatsapp link fallback
      const linkText = formData.whatsappLink.trim() || `Olá Leidy! Desejo saber mais sobre o produto: ${formData.title}`;
      
      const newProduct: Product = {
        id: newId,
        catalog: formData.catalog as CatalogType,
        title: formData.title,
        description: formData.description,
        badge: formData.badge || 'PREMIUM SELECTION',
        price: formData.price || 'Sob Consulta',
        promotionalPrice: formData.promotionalPrice || undefined,
        notes: formData.notes,
        imageUrl: formData.imageUrl,
        whatsappLink: linkText,
        indexNum: '00/00' // Temporary, will be reindexed immediately
      };
      
      updatedProducts.push(newProduct);
    } else if (editingProduct) {
      updatedProducts = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            catalog: formData.catalog as CatalogType,
            title: formData.title,
            description: formData.description,
            badge: formData.badge,
            price: formData.price,
            promotionalPrice: formData.promotionalPrice || undefined,
            notes: formData.notes,
            imageUrl: formData.imageUrl,
            whatsappLink: formData.whatsappLink || `Olá Leidy! Quero encomendar o ${formData.title}`
          };
        }
        return p;
      });
    }

    // Always reindex to maintain pristine numbering (e.g., 01/15)
    const finalIndexed = updatedProducts.map((p, idx) => {
      const idxStr = String(idx + 1).padStart(2, '0');
      const totalStr = String(updatedProducts.length).padStart(2, '0');
      return {
        ...p,
        indexNum: `${idxStr}/${totalStr}`
      };
    });

    setProducts(finalIndexed);
    setEditingProduct(null);
    setIsAddingNew(false);
    logAction('Produto salvo e catálogo reindexado com sucesso.');
  };

  // Export JSON Catalog Backup
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ products, settings }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'catalogo_leidy_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Catalog Backup
  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        setImportStatus({ type: 'success', message: 'Catálogo importado com sucesso!' });
        setImportJson('');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus({ type: 'error', message: 'Formato inválido. Objeto do catálogo inválido.' });
      }
    } catch (err) {
      setImportStatus({ type: 'error', message: 'Erro ao processar JSON. Certifique-se de que o texto está correto.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#090909] sm:gold-fine-border p-4 sm:p-6 md:p-8 rounded-none min-h-screen sm:min-h-0 sm:my-10 relative">
        {/* Absolute Close Header button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gold transition-colors duration-200 z-50"
          id="btn-close-admin"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title Banner */}
        <div className="border-b border-gold/20 pb-4 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gold/10 text-gold border border-gold/30">
            {isAuthenticated ? <Unlock className="w-5 h-5 animate-pulse" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white uppercase" id="title-admin-header">
              {isAuthenticated ? 'CMS - Painel de Controle Leidy' : 'Acesso Restrito - Admin'}
            </h2>
            <p className="text-xs font-mono text-gray-400 tracking-wider">
              {isAuthenticated ? 'MÓDULO DE GERENCIAMENTO DE ACERVOS' : 'PAINEL DE ADMINISTRAÇÃO'}
            </p>
          </div>
        </div>

        {/* NOT AUTHENTICATED FORM SCREEN */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto py-4">
            {/* ALERT BOX FOR NORMAL USERS */}
            <div className="bg-red-950/40 border-l-4 border-red-600 p-4 mb-8">
              <div className="flex items-start">
                <Lock className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-500 font-bold font-mono text-sm uppercase tracking-wider">Acesso Altamente Restrito</h3>
                  <p className="text-red-200/70 text-xs mt-1 leading-relaxed">
                    Esta é a central de administração da loja. Se você é um cliente, por favor, feche esta janela para retornar ao catálogo público.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-gray-300">
                Seja bem-vinda, <strong className="text-gold">Leidy</strong>. Digite sua senha pessoal para gerenciar os catálogos.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" id="form-admin-login">
              <div>
                <label className="block text-xs font-mono text-gold tracking-widest uppercase mb-1">
                  Email Autenticado
                </label>
                <div className="w-full px-4 py-3 bg-[#111] text-gray-400 font-mono text-sm border border-white/10 select-none">
                  admin@leidy.com
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gold tracking-widest uppercase mb-1">
                  Chave de Acesso / Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-black text-white font-mono text-sm border border-gold/30 focus:border-gold outline-none transition-colors pr-12"
                    required
                    id="input-admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-xs font-mono text-red-500 bg-red-950/20 border border-red-900/40 p-3" id="login-error-msg">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-4.5 bg-gold text-black hover:bg-gold/90 font-display font-extrabold text-sm tracking-widest transition-all duration-300 pointer-events-auto select-none rounded-none cursor-pointer"
                id="btn-login-submit"
              >
                ENTRAR NO PAINEL DE CONTROLE
              </button>
            </form>
          </div>
        ) : (
          /* cms dashboard content once logged in */
          <div className="space-y-6">
            {/* Quick overview metric line */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black p-4 border border-white/5 text-center">
              <div>
                <span className="block text-[10px] text-gray-500 font-mono">NATURA</span>
                <span className="text-lg font-display font-semibold text-gold" id="stat-natura">
                  {products.filter(p => p.catalog === 'Natura').length} itens
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-mono">O BOTICÁRIO</span>
                <span className="text-lg font-display font-semibold text-gold" id="stat-boticario">
                  {products.filter(p => p.catalog === 'O Boticario').length} itens
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-mono">ARTE EM CROCHÊ</span>
                <span className="text-lg font-display font-semibold text-gold" id="stat-croche">
                  {products.filter(p => p.catalog === 'Croche').length} itens
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-mono">TOTAL DO PORTFÓLIO</span>
                <span className="text-lg font-display font-semibold text-white" id="stat-total">
                  {products.length} / 15 ideal
                </span>
              </div>
            </div>

            {/* Catalog sub menu navigation tabs */}
            <div className="flex border-b border-white/10 gap-2 overflow-x-auto text-sm">
              <button
                onClick={() => { setActiveTab('Natura'); setIsAddingNew(false); setEditingProduct(null); }}
                className={`px-4 py-2 font-display uppercase tracking-wider transition-all select-none cursor-pointer ${activeTab === 'Natura' ? 'border-b-2 border-gold text-gold font-bold' : 'text-gray-400 hover:text-white'}`}
                id="tab-natura"
              >
                Natura
              </button>
              <button
                onClick={() => { setActiveTab('O Boticario'); setIsAddingNew(false); setEditingProduct(null); }}
                className={`px-4 py-2 font-display uppercase tracking-wider transition-all select-none cursor-pointer ${activeTab === 'O Boticario' ? 'border-b-2 border-gold text-gold font-bold' : 'text-gray-400 hover:text-white'}`}
                id="tab-boticario"
              >
                O Boticário
              </button>
              <button
                onClick={() => { setActiveTab('Croche'); setIsAddingNew(false); setEditingProduct(null); }}
                className={`px-4 py-2 font-display uppercase tracking-wider transition-all select-none cursor-pointer ${activeTab === 'Croche' ? 'border-b-2 border-gold text-gold font-bold' : 'text-gray-400 hover:text-white'}`}
                id="tab-croche"
              >
                Crochê
              </button>
              <button
                onClick={() => { setActiveTab('Config'); setIsAddingNew(false); setEditingProduct(null); }}
                className={`px-4 py-2 font-display uppercase tracking-wider transition-all select-none cursor-pointer ml-auto flex items-center gap-1.5 ${activeTab === 'Config' ? 'border-b-2 border-gold text-gold font-bold' : 'text-gray-400 hover:text-white'}`}
                id="tab-config"
              >
                <Upload className="w-3.5 h-3.5 text-gold animate-pulse" /> Foto & Config
              </button>
            </div>

            {activeTab !== 'Config' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Catalog Product Listing */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#111111] p-3 border-l-2 border-gold">
                    <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                      CATÁLOGO {activeTab === 'O Boticario' ? 'O BOTICÁRIO' : activeTab.toUpperCase()}
                    </span>
                    <button
                      onClick={() => startAdd(activeTab)}
                      className="px-3 py-1 bg-gold text-black hover:bg-gold/80 font-mono text-[11px] font-bold flex items-center gap-1 select-none cursor-pointer"
                      id="btn-add-product"
                    >
                      <Plus className="w-3.5 h-3.5" /> NOVO
                    </button>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 border border-white/5 p-2 bg-black">
                    {products.filter(p => p.catalog === activeTab).length === 0 ? (
                      <p className="text-xs text-gray-500 font-mono py-4 text-center">Nenhum produto cadastrado neste catálogo.</p>
                    ) : (
                      products
                        .filter(p => p.catalog === activeTab)
                        .map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => startEdit(p)}
                            title="Clique para editar este item"
                            className={`flex items-center justify-between p-3 border transition-all cursor-pointer ${editingProduct?.id === p.id ? 'bg-[#151515] border-gold ring-1 ring-gold/20' : 'bg-[#0A0A0A] border-white/5 hover:border-gold/30 hover:bg-[#111111]/80'}`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gold bg-gold/10 px-1">{p.indexNum}</span>
                                <h4 className="text-xs font-display font-extrabold text-white truncate">{p.title}</h4>
                              </div>
                              <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">{p.description}</p>
                              <span className="text-[10px] font-mono text-gold mt-1 block font-bold">{p.price}</span>
                            </div>

                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => startEdit(p)}
                                className="p-1.5 bg-white/5 text-gray-400 hover:text-gold hover:bg-white/10 select-none cursor-pointer"
                                title="Editar"
                                id={`btn-edit-${p.id}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-950/20 select-none cursor-pointer"
                                title="Deletar"
                                id={`btn-delete-${p.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Create/Edit Form */}
                <div ref={formRef} className={`bg-[#0e0e0e] border border-white/5 p-4 space-y-4 ${!(isAddingNew || editingProduct) ? 'hidden lg:block' : ''}`}>
                  {(isAddingNew || editingProduct) ? (
                    <form onSubmit={handleSaveProduct} className="space-y-4" id="form-product-edit">
                      <h3 className="text-xs font-mono text-gold tracking-widest uppercase border-b border-white/10 pb-2 flex justify-between items-center">
                        <span>{isAddingNew ? `ADICIONAR NOVO AO CATÁLOGO ${activeTab.toUpperCase()}` : `EDITAR ITEM [${editingProduct?.indexNum}]`}</span>
                        <button type="button" onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="text-gray-500 hover:text-white p-1 bg-white/5 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-gray-400 font-mono mb-1">Título do Produto</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Essencial Supreme"
                            className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold"
                            required
                            id="edit-title"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 font-mono mb-1">Selo / Badge (Top Left)</label>
                          <input
                            type="text"
                            value={formData.badge}
                            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                            placeholder="Ex: NATURA HAUTE COUTURE"
                            className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold"
                            id="edit-badge"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block text-gray-400 font-mono mb-1">Descrição Comercial Curta</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Fórmula sofisticada ou tamanho do crochê..."
                          rows={2}
                          className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold resize-none"
                          id="edit-desc"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-gray-400 font-mono mb-1">Preço Público</label>
                          <input
                            type="text"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="Ex: R$ 289,90"
                            className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold"
                            id="edit-price"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 font-mono mb-1 text-gold">Preço Promocional (Opcional)</label>
                          <input
                            type="text"
                            value={formData.promotionalPrice || ''}
                            onChange={(e) => setFormData({ ...formData, promotionalPrice: e.target.value })}
                            placeholder="Ex: R$ 199,90"
                            className="w-full bg-black border border-gold/30 p-2 text-white outline-none focus:border-gold"
                            id="edit-promotional-price"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">

                        <div>
                          <label className="block text-gray-400 font-mono mb-1">Estilo Visual / Foto</label>
                          <div className="space-y-2">
                            <select
                              value={formData.imageUrl.startsWith('data:') || formData.imageUrl.startsWith('http') ? 'custom' : formData.imageUrl}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== 'custom') {
                                  setFormData({ ...formData, imageUrl: val });
                                }
                              }}
                              className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold text-xs"
                              id="edit-imageurl"
                            >
                              <option value="custom" disabled={!formData.imageUrl.startsWith('data:') && !formData.imageUrl.startsWith('http')}>
                                {formData.imageUrl.startsWith('data:') || formData.imageUrl.startsWith('http') ? '📸 Foto Personalizada de Envio' : '— Selecione um Modelo Vetor ou Faça Upload —'}
                              </option>
                              {activeTab !== 'Croche' ? (
                                <>
                                  <option value="perfume_gold_tall">Garrafa Dourada Elegante (Natura Estilo)</option>
                                  <option value="perfume_obsidian_block">Garrafa Preta Absoluta (Style Malbec)</option>
                                  <option value="perfume_bronze_ellipse">Garrafa Bronze Opulente</option>
                                  <option value="perfume_rose_gold_cylinder">Garrafa Cilíndrica Ouro Rosa</option>
                                  <option value="perfume_pitch_black">Esculpido Negro Total</option>
                                  <option value="perfume_crystal_gold">Frasco Cristal & Líquido Ouro</option>
                                </>
                              ) : (
                                <>
                                  <option value="crochet_mandala">Mandala Circular de Luxo</option>
                                  <option value="crochet_weave_blanket">Manta Retangular Teatral</option>
                                  <option value="crochet_bag_gold">Bolsa com Ferragens Ouro</option>
                                  <option value="crochet_classic_lace">Renda Clássica Premium</option>
                                  <option value="crochet_royalty_bath">Estampado de Algodão Nobre</option>
                                </>
                              )}
                            </select>

                            {/* Uploader Buttons */}
                            <div className="flex gap-2">
                              <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 hover:border-gold/40 text-[10px] sm:text-[11px] font-mono font-bold cursor-pointer transition-colors select-none text-center">
                                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                                <span>📷 UPLOAD DA FOTO</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleProductImageUpload}
                                />
                              </label>

                              {(formData.imageUrl.startsWith('data:') || formData.imageUrl.startsWith('http')) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      imageUrl: activeTab === 'Croche' ? 'crochet_mandala' : 'perfume_gold_tall'
                                    });
                                  }}
                                  className="px-2 py-1.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/30 text-[9px] font-mono select-none"
                                >
                                  RESTAURAR VETOR
                                </button>
                              )}
                            </div>

                            {/* Thumbnail Preview mini */}
                            {(formData.imageUrl.startsWith('data:') || formData.imageUrl.startsWith('http')) && (
                              <div className="flex items-center gap-2 p-1.5 bg-black border border-gold/20">
                                <img
                                  src={formData.imageUrl}
                                  alt="Preview"
                                  className="w-8 h-8 object-contain border border-white/10 bg-[#0d0d0d]"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[9px] font-mono text-gold truncate">
                                  Imagem customizada conectada
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block text-gray-400 font-mono mb-1">
                          {activeTab === 'Croche' ? 'Dimensões & Informações do Fio' : 'Notas Olfativas Importantes'}
                        </label>
                        <input
                          type="text"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder={activeTab === 'Croche' ? 'Ex: 1.20m x 0.80m | Algodão 100% orgânico' : 'Ex: Notas de topo, coração e madeiras nobres'}
                          className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold"
                          id="edit-notes"
                        />
                      </div>

                      <div className="text-xs">
                        <label className="block text-gray-400 font-mono mb-1">Mensagem do Link de Encomenda do WhatsApp</label>
                        <input
                          type="text"
                          value={formData.whatsappLink}
                          onChange={(e) => setFormData({ ...formData, whatsappLink: e.target.value })}
                          placeholder="Ex: Olá Leidy! Gostaria de encomendar este produto..."
                          className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold"
                          id="edit-walink"
                        />
                        <span className="text-[9px] text-gray-500 font-mono block mt-1">
                          *Deixe em branco para auto-gerar baseado no nome do produto.
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-gold text-black font-mono font-bold text-xs hover:bg-gold/90 transition-colors select-none cursor-pointer flex items-center justify-center gap-1.5"
                          id="btn-edit-save"
                        >
                          <Save className="w-3.5 h-3.5" /> SALVAR PRODUTO
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingProduct(null); setIsAddingNew(false); }}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-mono text-xs select-none cursor-pointer"
                          id="btn-edit-cancel"
                        >
                          CANCELAR
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                      <FileText className="w-10 h-10 text-gold/20 mb-3" />
                      <p className="text-xs font-mono">Nenhum item em edição.</p>
                      <p className="text-[10px] text-gray-600 font-mono mt-1">
                        Selecione um produto da lista no lado esquerdo ou clique em "NOVO" para editar detalhes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONFIGURATIONS & BACKUPS SCREEN */}
            {activeTab === 'Config' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Whatsapp configuration */}
                <div className="bg-black border border-white/5 p-5 space-y-4">
                  <h3 className="text-xs font-mono text-gold tracking-widest uppercase border-b border-white/10 pb-2 flex items-center gap-1.5 col-span-2">
                    <Phone className="w-4 h-4 text-gold" /> Configuração do WhatsApp Comercial
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-400 font-mono mb-1">WhatsApp de Contato (Com DDI + DDD)</label>
                      <input
                        type="text"
                        value={settings.whatsappNumber}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        placeholder="Ex: 5511999999999"
                        className="w-full bg-[#0E0E0E] border border-white/10 p-2 text-white outline-none focus:border-gold font-mono"
                        id="config-wa-number"
                      />
                      <span className="text-[9px] text-gray-500 block mt-1">
                        *Digite apenas números, começando com o código de país (55 para Brasil). Ex: 5521999999999
                      </span>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-mono mb-1">Título Geral da Loja</label>
                      <input
                        type="text"
                        value={settings.storeName}
                        onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                        className="w-full bg-[#0E0E0E] border border-white/10 p-2 text-white outline-none focus:border-gold"
                        id="config-store-name"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 font-mono mb-1">Mensagem do Botão de Contato Geral</label>
                      <textarea
                        value={settings.customGreeting}
                        onChange={(e) => setSettings({ ...settings, customGreeting: e.target.value })}
                        rows={2}
                        className="w-full bg-[#0E0E0E] border border-white/10 p-2 text-white outline-none focus:border-gold resize-none"
                        id="config-custom-greeting"
                      />
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-2">
                      <label className="block text-xs font-mono text-gold tracking-widest uppercase mb-1">
                        Alterar Senha de Acesso Seguro (Painel CMS)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha segura..."
                          className="flex-1 bg-[#0E0E0E] border border-gold/30 p-2 text-white outline-none focus:border-gold font-mono"
                          id="config-new-password"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newPassword) return;
                            if (supabase) {
                              const { error } = await supabase.auth.updateUser({ password: newPassword });
                              if (error) {
                                setPasswordChangeStatus('Erro: ' + error.message);
                              } else {
                                setPasswordChangeStatus('Sucesso! Senha alterada. Na próxima visita use esta senha.');
                                setNewPassword('');
                              }
                            } else {
                              setPasswordChangeStatus('Erro: Banco de dados não conectado.');
                            }
                          }}
                          className="bg-gold text-black px-4 font-mono font-bold hover:bg-gold/90 transition-colors"
                        >
                          SALVAR
                        </button>
                      </div>
                      <span className="text-[9px] text-gray-500 block mt-1 leading-normal">
                        *Ao salvar, a senha de segurança do Supabase será redefinida. Guarde-a com segurança, nem os desenvolvedores terão acesso a ela.
                      </span>
                      {passwordChangeStatus && (
                        <p className={`text-[10px] font-mono mt-2 p-1.5 ${passwordChangeStatus.includes('Sucesso') ? 'text-green-400 border border-green-900/50 bg-green-950/20' : 'text-red-400 border border-red-900/50 bg-red-950/20'}`}>
                          {passwordChangeStatus}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Photo Customization */}
                <div className="bg-[#0b0b0b] border border-gold/20 p-6 space-y-4 md:col-span-2">
                  <h3 className="text-xs font-mono text-gold tracking-widest uppercase border-b border-white/10 pb-2 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-gold animate-pulse" /> 📷 ALTERAR FOTO PRINCIPAL DA LEIDY (SOBRE O ATELIER)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Big Visual Preview Frame mirroring the Landing Page */}
                    <div className="relative w-full aspect-square md:max-w-[200px] border border-gold/30 bg-[#070707] overflow-hidden flex flex-col items-center justify-center p-2 rounded-none mx-auto shadow-[0_8px_30px_rgba(212,175,55,0.1)]">
                      <div className="absolute inset-2 border border-gold/10 z-20 pointer-events-none" />
                      
                      {/* Cohesive blurred background */}
                      <img
                        src={settings.profileImageUrl || 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600'}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-35 blur-md scale-110 z-0 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />

                      {/* Precise centerpiece preview matching the live layout */}
                      <img
                        src={settings.profileImageUrl || 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600'}
                        alt="Previsualização Lady Cosméticos"
                        className="absolute inset-0 w-full h-full object-contain p-3 opacity-95 z-10 bg-transparent"
                        referrerPolicy="no-referrer"
                      />
                      
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent z-15 pointer-events-none" />
                      <span className="absolute bottom-3 text-[8px] font-mono text-gold tracking-widest z-20 uppercase bg-black/75 px-1.5 py-0.5 border border-gold/20">
                        PÁGINA PRINCIPAL PREVIEW
                      </span>
                    </div>

                    {/* Controls Column */}
                    <div className="md:col-span-2 space-y-4 text-xs font-sans">
                      <p className="text-gray-300 text-xs leading-relaxed">
                        Este é o seu retrato oficial que aparece na seção <strong className="text-gold">"Sobre o Atelier"</strong> na página principal. Substitua-o enviando um arquivo de foto.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full">
                        <label className="w-full flex-1 px-3 py-3 bg-gold text-black hover:bg-gold/90 text-[10px] sm:text-xs font-sans font-bold cursor-pointer transition-all duration-300 select-none flex items-center justify-center gap-2 text-center">
                          <Upload className="w-4 h-4 text-black animate-pulse flex-shrink-0" /> 
                          <span>📷 UPLOAD DA MINHA FOTO</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              if (supabase) {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `profile_${Date.now()}.${fileExt}`;
                                const filePath = `profiles/${fileName}`;
                                const { error } = await supabase.storage.from('lady_bucket').upload(filePath, file);
                                if (error) {
                                  alert('Erro ao enviar imagem: ' + error.message);
                                  return;
                                }
                                const { data } = supabase.storage.from('lady_bucket').getPublicUrl(filePath);
                                setSettings({ ...settings, profileImageUrl: data.publicUrl });
                              } else {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setSettings({
                                      ...settings,
                                      profileImageUrl: event.target.result as string
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {settings.profileImageUrl !== 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Deseja restaurar a bela foto de modelo padrão?')) {
                                setSettings({
                                  ...settings,
                                  profileImageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600'
                                });
                              }
                            }}
                            className="px-3.5 py-3 bg-red-950/25 border border-red-900/40 text-red-400 hover:bg-red-900/30 text-xs font-sans font-medium transition-colors uppercase"
                          >
                            Restaurar Padrão
                          </button>
                        )}
                      </div>

                      <div className="bg-gold/5 border border-gold/15 p-2 text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                        <span>Sincronização Ativa: Qualquer alteração é gravada e aplicada instantaneamente no site.</span>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <label className="block text-gray-400 font-mono text-[11px]">Ou se preferir, Cole uma URL de foto externa</label>
                        <input
                          type="text"
                          value={settings.profileImageUrl || ''}
                          onChange={(e) => setSettings({ ...settings, profileImageUrl: e.target.value })}
                          placeholder="https://exemplo.com/sua-foto.jpg"
                          className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold font-mono text-xs"
                          id="config-profile-image-url"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Backups and seeds */}
                <div className="bg-black border border-white/5 p-5 space-y-4">
                  <h3 className="text-xs font-mono text-gold tracking-widest uppercase border-b border-white/10 pb-2 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-gold" /> Cópia de Segurança e Restauração
                  </h3>

                  <div className="space-y-4 text-xs">
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Todas as alterações feitas no catálogo são gravadas de forma segura no navegador. Você pode baixar uma cópia do arquivo de catálogo para salvar no seu computador ou restaurar uma cópia salvando abaixo.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleExport}
                        className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white font-mono font-bold text-xs select-none cursor-pointer flex items-center gap-1.5"
                        id="btn-export-json"
                      >
                        <Download className="w-3.5 h-3.5" /> EXPORTAR CATÁLOGO (.JSON)
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza de que deseja redefinir todo o acervo ao design modelo original de 15 produtos de luxo? Suas customizações serão perdidas.')) {
                            resetToDefault();
                            logAction('Recarregamento completo dos 15 itens originais concluído.');
                          }
                        }}
                        className="px-3 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 font-mono font-bold text-xs select-none cursor-pointer flex items-center gap-1.5"
                        id="btn-trigger-reset"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> RESETAR MODELO ORIGINAL
                      </button>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <label className="block text-gray-400 font-mono mb-1 font-bold">Importar Catálogo via JSON</label>
                      <textarea
                        value={importJson}
                        onChange={(e) => setImportJson(e.target.value)}
                        placeholder="Cole aqui o conteúdo do arquivo exportado para restaurar..."
                        rows={3}
                        className="w-full bg-[#0E0E0E] border border-white/10 p-2 text-white outline-none focus:border-gold font-mono"
                        id="input-import-json"
                      />
                      <button
                        onClick={handleImport}
                        disabled={!importJson.trim()}
                        className="w-full mt-2 py-2 bg-gold text-black disabled:opacity-45 hover:bg-gold/95 font-mono font-bold text-xs select-none cursor-pointer"
                        id="btn-trigger-import"
                      >
                        IMPORTAR AGORA
                      </button>

                      {importStatus && (
                        <p className={`text-[10px] font-mono p-2 mt-2 ${importStatus.type === 'success' ? 'bg-green-950/20 text-green-400 border border-green-900/40' : 'bg-red-950/20 text-red-400 border border-red-900/40'}`} id="import-status-msg">
                          {importStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Supabase Core Integration Portal */}
                <div className="col-span-1 md:col-span-2 bg-black border border-white/5 p-6 space-y-4 rounded-none shadow-[0_8px_30px_rgba(212,175,55,0.02)]">
                  <h3 className="text-xs font-mono text-gold tracking-widest uppercase border-b border-white/10 pb-2 flex items-center justify-between col-span-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Database className="w-4 h-4 text-gold animate-pulse" /> INTEGRAÇÃO E PERSISTÊNCIA EM CRONOGRAMA SUPABASE
                    </span>
                    {isSupabaseConfigured ? (
                      <span className="text-[9px] font-mono bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 uppercase tracking-wide font-bold">
                        ● Ativo & Sincronizado
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 uppercase tracking-wide">
                        Offline (LocalStorage)
                      </span>
                    )}
                  </h3>

                  <div className="space-y-4 text-xs">
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      {isSupabaseConfigured ? (
                        <span>
                          Sua aplicação <strong>Lady Cosméticos</strong> está conectada em tempo real ao banco de dados relacional oficial de produção da <strong>Supabase</strong>! Qualquer nova modificação feita nos produtos, links rápidos, imagens e configurações do WhatsApp é sincronizada com um mecanismo inteligente em background com debounce automático de 1.5s preservando a performance do site em 60FPS.
                        </span>
                      ) : (
                        <span>
                          O catálogo e as informações do painel estão operando em sandbox (<strong>LocalStorage local do navegador</strong>). Para habilitar a sincronização na nuvem e permitir que os dados persistam de forma definitiva para múltiplos dispositivos, basta declarar as chaves <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no seu painel de Deploy/Hospedagem.
                        </span>
                      )}
                    </p>

                    <div className="bg-[#070707] border border-white/10 p-4 space-y-3">
                      <span className="text-[10px] font-mono text-gold tracking-wider uppercase block font-semibold flex items-center gap-1.5">
                        🛠️ Script de Migração SQL (Copie e execute no painel do Supabase)
                      </span>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Acesse seu console do Supabase, vá em <strong>SQL Editor</strong>, clique em <strong>New Query</strong>, cole o código abaixo e clique em <strong>Run</strong>:
                      </p>
                      
                      <div className="relative">
                        <pre className="w-full max-h-[160px] overflow-y-auto bg-black text-gray-400 p-3 font-mono text-[9px] leading-relaxed border border-white/5 whitespace-pre-wrap select-all rounded-none">
                          {SUPABASE_SQL_SETUP}
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                            setSqlCopied(true);
                            setTimeout(() => setSqlCopied(false), 2500);
                          }}
                          className={`absolute top-2 right-2 px-2.5 py-1.5 border font-mono text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1.5 rounded-none ${sqlCopied ? 'bg-gold text-black border-gold' : 'bg-neutral-950/80 border-white/10 text-white/60 hover:text-gold hover:border-gold/50'}`}
                          title="Copiar Script"
                          type="button"
                        >
                          {sqlCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>COPIADO!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>COPIAR SCRIPT SQL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER DO PAINEL ADMIN */}
        <div className="mt-8 pt-4 border-t border-gold/20 flex justify-between items-center px-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Sistema Seguro • Nuvem Ativa
          </div> 
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPassword('');
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 font-mono hover:text-red-400 select-none cursor-pointer"
                id="btn-admin-logout"
              >
                ENCERRAR SESSÃO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
