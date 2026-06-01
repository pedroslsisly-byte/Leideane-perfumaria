/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Product, AdminSettings } from './types';
import { INITIAL_PRODUCTS, DEFAULT_SETTINGS } from './initialData';
import ProductVisual from './components/ProductVisual';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { CatalogType } from './types';
import { 
  Sparkles, 
  Lock, 
  ChevronRight, 
  ArrowRight, 
  MessageCircle, 
  Search, 
  Filter, 
  ArrowUp, 
  VolumeX, 
  Volume2, 
  Compass, 
  X,
  Instagram,
  Heart,
  Calendar,
  Phone
} from 'lucide-react';

export default function App() {
  // Catalogs state loaded from LocalStorage or seeded from default 15 luxury items
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('leidy_premium_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Error loading products from cache, using default seeds.', err);
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('leidy_premium_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically upgrade empty or default mock numbers to the active phone number
        if (!parsed.whatsappNumber || parsed.whatsappNumber === '5511999999999') {
          parsed.whatsappNumber = '5591985054580';
        }
        return parsed;
      } catch (err) {
        console.error('Error loading settings from cache.', err);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Persist edits to LocalStorage
  useEffect(() => {
    localStorage.setItem('leidy_premium_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('leidy_premium_settings', JSON.stringify(settings));
  }, [settings]);

  // --- SUPABASE SYNCHRONIZATION AND FETCH ENGINE ---
  const [isSupabaseLoading, setIsSupabaseLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadSupabaseData = async () => {
      try {
        setIsSupabaseLoading(true);
        
        // 1. Fetch settings from 'lady_settings'
        const { data: settingsData } = await supabase
          .from('lady_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (settingsData) {
          setSettings({
            storeName: settingsData.store_name,
            whatsappNumber: settingsData.whatsapp_number,
            customGreeting: settingsData.custom_greeting,
            profileImageUrl: settingsData.profile_image_url || undefined,
          });
        } else {
          // No row found: seed the default row
          await supabase
            .from('lady_settings')
            .upsert({
              id: 'default',
              store_name: settings.storeName,
              whatsapp_number: settings.whatsappNumber,
              custom_greeting: settings.customGreeting,
              profile_image_url: settings.profileImageUrl || null,
            }, { onConflict: 'id' });
        }

        // 2. Fetch products from 'lady_products'
        const { data: productsData } = await supabase
          .from('lady_products')
          .select('*')
          .order('index_num', { ascending: true });

        if (productsData && productsData.length > 0) {
          const mappedProducts: Product[] = productsData.map((p) => ({
            id: p.id,
            catalog: p.catalog as CatalogType,
            title: p.title,
            description: p.description,
            badge: p.badge,
            indexNum: p.index_num,
            price: p.price,
            promotionalPrice: p.promotional_price,
            notes: p.notes,
            imageUrl: p.image_url,
            whatsappLink: p.whatsapp_link,
          }));
          setProducts(mappedProducts);
        } else {
          // If table is empty, seed it with current product list
          if (products.length > 0) {
            const seedProducts = products.map((p) => ({
              id: p.id,
              catalog: p.catalog,
              title: p.title,
              description: p.description,
              badge: p.badge,
              index_num: p.indexNum,
              price: p.price,
              promotional_price: p.promotionalPrice || null,
              notes: p.notes,
              image_url: p.imageUrl,
              whatsapp_link: p.whatsappLink,
            }));
            await supabase
              .from('lady_products')
              .insert(seedProducts);
          }
        }
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
      } finally {
        setIsSupabaseLoading(false);
      }
    };

    loadSupabaseData();
  }, []);

  // Sync state modifications to Supabase with background debouncing
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || isSupabaseLoading) return;

    const timer = setTimeout(async () => {
      try {
        const supabaseProducts = products.map((p) => ({
          id: p.id,
          catalog: p.catalog,
          title: p.title,
          description: p.description,
          badge: p.badge,
          index_num: p.indexNum,
          price: p.price,
          promotional_price: p.promotionalPrice || null,
          notes: p.notes,
          image_url: p.imageUrl,
          whatsapp_link: p.whatsappLink,
        }));

        // Delete products in Supabase that are no longer present in the local state list
        const productIds = products.map(p => p.id);
        if (productIds.length > 0) {
          const idListString = productIds.map(id => `"${id}"`).join(',');
          await supabase
            .from('lady_products')
            .delete()
            .not('id', 'in', `(${idListString})`);
        } else {
          await supabase
            .from('lady_products')
            .delete()
            .neq('id', 'null');
        }

        // Upsert remains of the product catalogue
        if (supabaseProducts.length > 0) {
          await supabase
            .from('lady_products')
            .upsert(supabaseProducts, { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Failed to sync products list to Supabase:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [products, isSupabaseLoading]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || isSupabaseLoading) return;

    const timer = setTimeout(async () => {
      try {
        await supabase
          .from('lady_settings')
          .upsert({
            id: 'default',
            store_name: settings.storeName,
            whatsapp_number: settings.whatsappNumber,
            custom_greeting: settings.customGreeting,
            cms_password: settings.cmsPassword || null,
            profile_image_url: settings.profileImageUrl || null,
          }, { onConflict: 'id' });
      } catch (err) {
        console.error('Failed to sync settings variables to Supabase:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [settings, isSupabaseLoading]);

  // Window sizing responder for perfect multi-device luxury scaling
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // UI state managers
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [gridFilter, setGridFilter] = useState<'all' | 'Natura' | 'O Boticario' | 'Croche'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCatalogText, setActiveCatalogText] = useState<string>('Perfumaria & Arte Fina');

  // Ambient synth player to elevate 8K immersive luxury vibe (Optional fine experience)
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // References for scroll tracking
  const containerRef = useRef<HTMLDivElement>(null);

  // Set up passive scroll tracking for high-performance 60fps scrubbing
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Total height of the 3D scroll container minus viewport height
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;
      
      const rawProgress = -rect.top / totalScrollable;
      const clamped = Math.min(Math.max(rawProgress, 0), 0.99);
      setScrollProgress(clamped);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Soft synth loop generating gentle cinematic soundscape representing premium scents
  const toggleAmbientAudio = () => {
    if (isAudioPlaying) {
      // Fade out and stop
      if (gainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        gainRef.current.gain.linearRampToValueAtTime(0, now + 1.2);
        setTimeout(() => {
          if (oscRef.current) {
            try { oscRef.current.stop(); } catch(e){}
            oscRef.current = null;
          }
          setIsAudioPlaying(false);
          console.log('[Audio] Ambient luxury synth stopped');
        }, 1300);
      }
    } else {
      // Start ambient synth
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Custom sweeping low-pass filter representing velvet warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime); // Low noble amber frequency

        // Subtle slow vibrato sweep
        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.setValueAtTime(0.2, ctx.currentTime); // Very slow breathing loop
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.setValueAtTime(1.5, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        // Soft fade in to prevent clicks
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.0);

        // Connections
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        vibrato.start();
        osc.start();

        oscRef.current = osc;
        gainRef.current = gainNode;
        setIsAudioPlaying(true);
        console.log('[Audio] Gentle cinematic scent loop initiated');
      } catch (err) {
        console.error('Audio synthesizer not supported on active browser frame.', err);
      }
    }
  };

  // Reset to initial 15 preloaded items
  const resetToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('leidy_premium_products');
    localStorage.removeItem('leidy_premium_settings');
  };

  // Build high-performance path transform mapping progress P (0 - 1)
  const getCardTransform = (idx: number, overallProgress: number) => {
    const totalCards = products.length;
    // Sequential stagger to trace a cohesive path
    const stagger = 0.052;
    const duration = 0.35; // How long each card flies
    const start = idx * stagger;
    
    // Calculate personal progress parameter u
    let u = 0;
    let isExited = false;
    let isRestingInDeck = false;

    if (overallProgress < start) {
      isRestingInDeck = true;
      // Stacking offset formula for beautiful bottom-left hand deck
      u = (overallProgress - start) * 0.1; // Slights backwards motion
    } else if (overallProgress > start + duration) {
      isExited = true;
      u = 1.0;
    } else {
      u = (overallProgress - start) / duration;
    }

    // Device profile detection to establish beautiful scaling bounds
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    // Adapting parameters to fit screen size perfectly
    const xMultiplier = isMobile ? 12 : isTablet ? 22 : 35;
    const yMultiplier = isMobile ? 22 : isTablet ? 30 : 38;
    const zMultiplier = isMobile ? 180 : isTablet ? 280 : 370;
    const zOffset = isMobile ? -80 : isTablet ? -120 : -150;

    const maxRotX = isMobile ? 35 : isTablet ? 45 : 60;
    const maxRotY = isMobile ? 40 : isTablet ? 65 : 90;
    const maxRotZ = isMobile ? 12 : isTablet ? 18 : 24;

    // Trajectory curves based on device boundaries
    // x: bottom-left (-xMultiplier vw) -> center (0vw) -> top-right (+xMultiplier vw)
    let x = -xMultiplier + u * (xMultiplier * 2);
    
    // y: bottom-left (+yMultiplier vh) -> center (0vh) -> top-right (-yMultiplier vh).
    // Plus a beautiful mathematical sine curve to arch gracefully through the middle axis
    let y = yMultiplier * (1 - 2 * u) - (isMobile ? 6 : 14) * Math.sin(u * Math.PI);

    // z: edge receding -> center pop-forward -> edge receding
    let z = zOffset + zMultiplier * Math.sin(u * Math.PI);

    // Rotations adapted safely
    let rx = (u - 0.5) * maxRotX;
    let ry = (0.5 - u) * maxRotY;
    let rz = (u - 0.5) * maxRotZ;

    // Custom offsets for fanned layout when Resting in starting deck
    if (isRestingInDeck) {
      const deckPositionShift = idx * (isMobile ? 0.15 : isTablet ? 0.35 : 0.45); // Smooth stack separation
      x = -xMultiplier + deckPositionShift;
      y = yMultiplier - deckPositionShift;
      z = zOffset + idx * 2.2;
      rx = -20 + idx * 0.5;
      ry = (isMobile ? 15 : isTablet ? 30 : 45) - idx * 0.8;
      rz = -8 + idx * 0.4;
    } else if (isExited) {
      // Disappear cleanly past screen border
      const exitShift = idx * 0.15;
      x = xMultiplier + exitShift;
      y = -yMultiplier - exitShift;
      z = zOffset - 10 - idx * 2;
      rx = isMobile ? 18 : 32;
      ry = isMobile ? -20 : -45;
      rz = 12;
    }

    // Determine opacity to prevent cluttering starting deck or exiting cards
    let opacity = 1.0;
    if (isRestingInDeck) {
      // Stack fades into background deep, top cards are highly visible
      opacity = Math.max(0.2, 0.95 - (totalCards - 1 - idx) * 0.08);
    } else if (isExited) {
      opacity = Math.max(0, 1.0 - (u - 1.0) * 10); // Super fast exit fade out
    } else {
      // Full fidelity mid flight focus
      opacity = 1.0;
    }

    return {
      transform: `translate3d(${x}vw, ${y}vh, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
      opacity: opacity,
      zIndex: isRestingInDeck ? idx : (100 - idx)
    };
  };

  // Dynamic status text update as cards glide
  useEffect(() => {
    const indexProgress = Math.floor(scrollProgress * products.length);
    const activeIndex = Math.min(Math.max(indexProgress, 0), products.length - 1);
    
    if (scrollProgress < 0.1) {
      setActiveCatalogText("A Coleção Exclusiva da Leidy");
    } else if (products[activeIndex]) {
      const p = products[activeIndex];
      const catText = p.catalog === 'Natura' ? 'Fragrâncias Clássicas Natura' 
                    : p.catalog === 'O Boticario' ? 'Alta Perfumaria O Boticário' 
                    : 'Sophificadas Tramas do Crochê Fino';
      setActiveCatalogText(`${catText} [${p.indexNum}]`);
    }
  }, [scrollProgress, products]);

  // Handle WhatsApp Checkout Message Compile
  const handleWhatsAppCheckout = (p: Product) => {
    const finalPrice = p.promotionalPrice || p.price;
    const textMessage = p.whatsappLink ? encodeURIComponent(p.whatsappLink) 
      : encodeURIComponent(`Olá Leidy! Fiquei encantada pelo "${p.title}" do seu catálogo de luxo (${finalPrice}). Gostaria de encomendar esta peça!`);
    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${textMessage}`;
    window.open(waUrl, '_blank');
  };

  const handleGeneralContact = () => {
    const textMessage = encodeURIComponent(settings.customGreeting);
    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${textMessage}`;
    window.open(waUrl, '_blank');
  };

  // Filter products for the detailed Showcase list
  const filteredProducts = products.filter(p => {
    const matchesFilter = gridFilter === 'all' || p.catalog === gridFilter;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-black text-white bg-grid-premium selection:bg-gold selection:text-black">
      
      {/* GLOWING AMBIENT METALLIC EDGE HIGHLIGHT (Simulating studio photography environment) */}
      <div className="fixed top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-gold/40 to-transparent z-50 pointer-events-none" />

      {/* FIXED PREMIUM HEADER */}
      <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md border-b border-white/10 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 md:py-4 flex items-center justify-between">
          <div className="flex flex-col select-none">
            <h1 className="text-xl sm:text-2xl flex items-center font-sans font-semibold tracking-[0.15em] text-gold">
              LADY COSMÉTICOS
            </h1>
            <span className="text-[8px] font-sans text-gold/80 tracking-[0.35em] font-medium block mt-0.5 uppercase">
              Perfumaria & Crochê Premium
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-[10px] tracking-[0.2em] uppercase text-white/60 font-sans">
            <a href="#experiencia-3d" className="hover:text-white hover:underline underline-offset-4 transition-all duration-200">
              Desfile 3D
            </a>
            <a href="#vitrine-catalogo" className="hover:text-white hover:underline underline-offset-4 transition-all duration-200">
              Coleções
            </a>
            <a href="#sobre-leidy" className="hover:text-white hover:underline underline-offset-4 transition-all duration-200">
              O Atelier
            </a>
            <button
              onClick={handleGeneralContact}
              className="text-gold/90 hover:text-gold transition-all duration-200 flex items-center gap-1 cursor-pointer tracking-[0.2em]"
            >
              Falar com Leidy
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {/* Ambient Synth Controller */}
            <button
              onClick={toggleAmbientAudio}
              className="p-1.5 border border-white/10 hover:border-gold/40 text-gray-400 hover:text-gold transition-all duration-200 cursor-pointer select-none"
              title="Música de fundo para imersão"
              id="btn-sound-toggle"
            >
              {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5 text-gold animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* CMS Access Lock Icon styled precisely as the luxury border button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-1.5 border border-gold text-[10px] tracking-[0.2em] text-gold uppercase bg-transparent hover:bg-gold hover:text-black font-sans font-bold transition-all duration-300 cursor-pointer"
              id="btn-open-admin-cms"
            >
              <span>PAINEL CMS</span>
            </button>
          </div>
        </div>
      </header>

      {/* IMMERSIVE PARALLAX HERO SECTION WITH 3D SCRUBBING STAGE */}
      <section 
        id="experiencia-3d" 
        ref={containerRef} 
        className="relative h-[480vh] w-full bg-black select-none pointer-events-none"
      >
        {/* Sticky viewport frame */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center">
          
          {/* STATIC BACKGROUND LARGE METALLIC TYPOGRAPHY WITH NATURAL PARALLAX */}
          <div className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none overflow-hidden select-none z-0">
            {/* Elegant luxury top subtitle seal - safely placed underneath header */}
            <div className="absolute top-24 md:top-28 text-[9px] uppercase font-sans tracking-[0.3em] text-gold/40 flex items-center gap-1.5 font-light z-10">
              <Compass className="w-3.5 h-3.5 animate-spin-slow text-gold/50" /> CURADORIA TÉCNICA EM PERFUMARIA DE LUXO
            </div>

            {/* Ghost editorial watermark in background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] select-none pointer-events-none z-0">
              <h1 className="text-[25vw] font-black tracking-tighter uppercase leading-none text-white font-sans overflow-hidden">
                PERFUME
              </h1>
            </div>

            {/* Editorial Showcase Heading - strictly positioned at absolute coordinates to avoid squishing */}
            <div 
              className="absolute top-36 md:top-40 text-center z-15"
              style={{
                transform: `scale(${1 - scrollProgress * 0.05}) translateY(${scrollProgress * -20}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-sans font-extralight tracking-[0.15em] mb-2 uppercase text-white leading-none">
                PERFUMARIA <span className="text-gold font-light">&</span> ARTE
              </h2>
              <p className="text-[9px] md:text-xs text-white/40 tracking-[0.4em] font-light uppercase font-sans">
                Fragrâncias Exclusivas & Crochê Premium
              </p>
            </div>

            {/* Lens Focus Hairline connecting heading downward */}
            <div className="absolute top-[280px] md:top-[300px] w-[1px] h-12 bg-gradient-to-b from-gold/30 to-transparent opacity-30 z-10 hidden sm:block" />

            {/* Giant Title 1 Level Parallax Backing - centered behind the cards */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
              style={{
                transform: `scale(${1 + scrollProgress * 0.12}) translateY(${scrollProgress * -10}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            >
              <h1 
                className="text-[9vw] sm:text-[9vw] md:text-[10vw] font-display font-light text-[#0a0a0a] select-none uppercase tracking-[0.05em] leading-none text-center"
              >
                LADY COSMÉTICOS
              </h1>
            </div>
          </div>

          {/* DYNAMIC STAGGERED 3D CARD FLOW CONTAINER */}
          <div 
            className="relative w-full h-full flex items-center justify-center transform-gpu cursor-grab overflow-visible"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          >
            {products.map((p, idx) => {
              const cardStyle = getCardTransform(idx, scrollProgress);
              
              return (
                <div
                  key={p.id}
                  className="absolute w-[230px] sm:w-[280px] h-[330px] sm:h-[390px] bg-[#141414] border border-white/20 hover:border-gold p-4 sm:p-6 flex flex-col justify-between transition-shadow select-none pointer-events-auto cursor-pointer"
                  style={{
                    ...cardStyle,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    boxShadow: scrollProgress > 0.05 && Math.abs((scrollProgress - (idx * 0.055)) / 0.35 - 0.5) < 0.15 
                      ? '0 30px 60px rgba(212,175,55,0.12)' 
                      : '0 4px 20px rgba(0,0,0,0.6)'
                  }}
                  onClick={() => setSelectedProduct(p)}
                  id={`floating-card-${p.id}`}
                >
                  {/* Sweep light effect on border edges */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-50" />

                  {/* Top Header of Card */}
                  <div className="flex items-center justify-between text-[9px] font-sans tracking-[0.1em] uppercase">
                    <span className="px-2 py-0.5 bg-gold text-black text-[8px] font-bold tracking-[0.2em] uppercase truncate max-w-[130px] sm:max-w-none">
                      {p.badge}
                    </span>
                    <span className="text-white/40 font-mono font-medium tracking-widest">{p.indexNum}</span>
                  </div>

                  {/* Core 3D visual renderer */}
                  <div className="flex-1 w-full my-2 sm:my-4 flex items-center justify-center overflow-hidden bg-black/10 border border-white/5 relative">
                    <ProductVisual id={p.id} catalog={p.catalog} imageUrl={p.imageUrl} />
                  </div>

                  {/* Center Metadata Product Name */}
                  <div className="text-center pt-0.5 pb-1.5">
                    <h3 className="text-xs sm:text-base font-display font-medium text-white uppercase tracking-[0.15em] line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-[8px] sm:text-[9px] font-sans text-white/40 line-clamp-1 tracking-[0.1em] mt-0.5 sm:mt-1 uppercase">
                      {p.notes}
                    </p>
                  </div>

                  {/* Bottom Panel Actions */}
                  <div className="pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      {p.promotionalPrice ? (
                        <>
                          <span className="text-[9px] font-mono font-medium text-white/40 line-through decoration-red-500/50">{p.price}</span>
                          <span className="text-xs font-mono font-bold text-gold underline underline-offset-4 decoration-gold/50">
                            {p.promotionalPrice}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-mono font-medium text-white/80 underline underline-offset-4 sm:underline-offset-8 decoration-gold/30">
                          {p.price}
                        </span>
                      )}
                    </div>
                    <div 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-none border border-gold bg-transparent hover:bg-gold text-gold hover:text-black flex items-center justify-center transition-all duration-300"
                    >
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Elegant Control Deck at the Bottom (Unified context & status deck to prevent overlapping) */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none select-none text-center z-20 space-y-1 w-[90%] max-w-sm">
            <span className="text-[9px] font-sans tracking-[0.25em] text-white/40 uppercase">
              Status do Desfile
            </span>
            <span className="text-xs lg:text-sm font-sans tracking-[0.2em] text-gold uppercase font-medium line-clamp-1">
              {activeCatalogText}
            </span>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.15em] block">
              Ajuste de Foco em Tempo Real • {Math.round(scrollProgress * 100)}%
            </span>
            
            <div className="pt-2 flex flex-col items-center">
              <span className="text-[8px] font-sans tracking-[0.25em] text-gold/60 animate-pulse uppercase">
                ROLE PARA BAIXO • DESLIZAMENTO DIGITAL 3D
              </span>
              <div className="w-4 h-6 border border-gold/25 rounded-full flex items-start justify-center p-0.5 mt-1">
                <div className="w-1 h-1 bg-gold rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* DETAILED STATS BANNER */}
      <section className="bg-black py-20 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="md:border-r border-white/10 pr-6 space-y-3">
            <span className="text-gold font-sans text-[10px] tracking-[0.25em] uppercase font-medium block">Fragrâncias Exclusivas</span>
            <h3 className="text-2xl font-display font-light text-white tracking-wide">Curadoria de Alta Perfumaria</h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans tracking-wide font-light">
              O Boticário e Natura cuidadosamente selecionados em suas linhas mais sofisticadas. Eau de Parfums opulentos e assinaturas raras para pessoas exigentes.
            </p>
          </div>
          <div className="md:border-r border-white/10 pr-6 space-y-3">
            <span className="text-gold font-sans text-[10px] tracking-[0.25em] uppercase font-medium block">Arte de Fiar Manual</span>
            <h3 className="text-2xl font-display font-light text-white tracking-wide">Crochê Inteiramente Manual</h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans tracking-wide font-light">
              Pontos refinados estruturados à mão com algodão orgânico e fios náuticos metalizados. Peças decorativas monumentais e vestuários feitos sob medida.
            </p>
          </div>
          <div className="space-y-3">
            <span className="text-gold font-sans text-[10px] tracking-[0.25em] uppercase font-medium block">Experiência Integrada</span>
            <h3 className="text-2xl font-display font-light text-white tracking-wide">Encomendas Diretas 1-on-1</h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans tracking-wide font-light">
              Cada produto clicado gera um redirecionamento seguro para o WhatsApp oficial de atendimento da Leidy, garantindo exclusividade e envio consultivo personalizado.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN SEARCHABLE GRID INDEX LISTING (VITRINE) */}
      <section id="vitrine-catalogo" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Section banner matching minimalist aesthetic */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 gap-4">
            <div>
              <span className="text-[10px] tracking-[0.25em] text-gold uppercase font-sans font-light">Acervo Exclusivo de Vendas</span>
              <h2 className="text-3xl md:text-5xl font-display font-light tracking-wide mt-2 text-white uppercase">
                Explore Todas as Coleções
              </h2>
            </div>

            {/* Premium search engine bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="BUSCAR FRAGRÂNCIA, NOTAS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0c0c0c] border border-white/15 px-10 py-3 text-xs text-white outline-none focus:border-gold font-sans uppercase tracking-widest placeholder:text-white/20"
                id="search-input-field"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gold"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Luxury filters tabs list */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setGridFilter('all')}
              className={`px-5 py-2.5 text-[9px] font-sans uppercase tracking-[0.2em] border transition-all cursor-pointer select-none font-bold ${gridFilter === 'all' ? 'border-gold text-gold bg-gold/5' : 'border-white/10 hover:border-white/30 text-white/60 hover:text-white'}`}
              id="filter-tag-all"
            >
              TODAS AS NOVIDADES ({products.length})
            </button>
            <button
              onClick={() => setGridFilter('Natura')}
              className={`px-5 py-2.5 text-[9px] font-sans uppercase tracking-[0.2em] border transition-all cursor-pointer select-none font-bold ${gridFilter === 'Natura' ? 'border-gold text-gold bg-gold/5' : 'border-white/10 hover:border-white/30 text-white/60 hover:text-white'}`}
              id="filter-tag-natura"
            >
              Natura ({products.filter(p => p.catalog === 'Natura').length})
            </button>
            <button
              onClick={() => setGridFilter('O Boticario')}
              className={`px-5 py-2.5 text-[9px] font-sans uppercase tracking-[0.2em] border transition-all cursor-pointer select-none font-bold ${gridFilter === 'O Boticario' ? 'border-gold text-gold bg-gold/5' : 'border-white/10 hover:border-white/30 text-white/60 hover:text-white'}`}
              id="filter-tag-boticario"
            >
              O Boticário ({products.filter(p => p.catalog === 'O Boticario').length})
            </button>
            <button
              onClick={() => setGridFilter('Croche')}
              className={`px-5 py-2.5 text-[9px] font-sans uppercase tracking-[0.2em] border transition-all cursor-pointer select-none font-bold ${gridFilter === 'Croche' ? 'border-gold text-gold bg-gold/5' : 'border-white/10 hover:border-white/30 text-white/60 hover:text-white'}`}
              id="filter-tag-croche"
            >
              Arte em Crochê ({products.filter(p => p.catalog === 'Croche').length})
            </button>
          </div>

          {/* Visual Grid display */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 border border-white/10 bg-black">
              <p className="text-xs font-sans tracking-[0.1em] text-white/40 uppercase">Nenhum tesouro encontrado com a busca ativa.</p>
              <button 
                onClick={() => { setSearchQuery(''); setGridFilter('all'); }} 
                className="mt-3 text-xs text-gold underline tracking-wider uppercase font-semibold cursor-pointer hover:text-white"
              >
                Limpar busca e filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="bg-[#141414] border border-white/15 hover:border-gold/50 p-6 flex flex-col justify-between group cursor-pointer transition-all duration-300 sweep-container"
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex justify-between items-center text-[9px] font-sans mb-4">
                      <span className="text-gold tracking-[0.2em] font-semibold text-[8px] uppercase bg-gold/5 px-2 py-0.5 border border-gold/15 truncate max-w-[130px]">{p.badge}</span>
                      <span className="text-white/30 font-mono tracking-wider">{p.indexNum}</span>
                    </div>

                    {/* Compact Image/Vector container with hover zoom */}
                    <div className="h-48 w-full bg-[#0d0d0d] border border-white/10 group-hover:border-gold/20 flex items-center justify-center p-4 relative transition-transform overflow-hidden">
                      <div className="relative w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                        <ProductVisual id={p.id} catalog={p.catalog} imageUrl={p.imageUrl} />
                      </div>
                    </div>

                    {/* Content title */}
                    <h3 className="text-sm font-display font-light text-white uppercase tracking-[0.15em] mt-5 line-clamp-1 group-hover:text-gold transition-colors duration-200">
                      {p.title}
                    </h3>
                    <p className="text-[10px] font-sans text-white/40 line-clamp-2 leading-relaxed mt-1.5">
                      {p.description}
                    </p>
                  </div>

                  {/* Pricing footer block */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-5">
                    <div className="flex flex-col">
                      {p.promotionalPrice ? (
                        <>
                          <span className="text-[9px] font-mono font-medium text-white/40 line-through decoration-red-500/50">{p.price}</span>
                          <span className="text-xs font-mono font-bold text-gold underline underline-offset-4 decoration-gold/50 group-hover:text-gold transition-colors duration-200">
                            {p.promotionalPrice}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-mono font-medium tracking-wider text-white/50 underline underline-offset-8 decoration-gold/20 group-hover:text-white transition-colors duration-200">{p.price}</span>
                      )}
                    </div>
                    <span className="text-[9px] text-gold font-sans tracking-[0.2em] font-semibold flex items-center gap-1">
                      DETALHES <ChevronRight className="w-3 h-3 text-gold" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT DESIGNER LEIDY SECTION */}
      <section id="sobre-leidy" className="py-24 bg-black border-t border-white/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          
          {/* Aesthetic Luxury Portrait Frame representing craftsmanship */}
          <div className="relative border border-gold/15 bg-[#070707] aspect-square overflow-hidden flex flex-col items-center justify-center group shadow-[0_12px_45px_rgba(212,175,55,0.06)]">
            {/* Fine framing line */}
            <div className="absolute inset-4 border border-gold/15 z-20 pointer-events-none" />
            
            {/* Elegant blurred backdrop keeping color palette cohesive under the frame */}
            <img 
              src={settings.profileImageUrl || 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600'} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-35 blur-xl scale-110 z-0 pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Core profile portrait displayed perfectly without distortion or ugly crops */}
            <img 
              src={settings.profileImageUrl || 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600'} 
              alt="Lady Cosméticos" 
              className="absolute inset-0 w-full h-full object-contain p-5 sm:p-6 opacity-90 group-hover:scale-102 transition-transform duration-700 z-10 bg-transparent"
              referrerPolicy="no-referrer"
            />
            
            {/* Immersive overlay matching the luxury twilight theme to make text readable */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/50 to-transparent z-15 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/50 to-transparent z-15 pointer-events-none" />

            <div className="absolute bottom-8 left-8 right-8 text-left space-y-1.5 z-25 select-none">
              <span className="font-sans text-[8px] text-gold tracking-[0.3em] uppercase block font-semibold">ARTE & ESSÊNCIA</span>
              <span className="font-display font-light text-2xl tracking-[0.2em] uppercase block text-white">LADY COSMÉTICOS</span>
              <span className="font-sans text-[8px] text-white/40 block tracking-[0.25em] uppercase">Curadoria Técnica Unificada</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[9px] tracking-[0.2em] uppercase font-sans">
              <Sparkles className="w-3 h-3 text-gold animate-pulse" /> SINFONIA DE SENTIDOS & ESTILO
            </div>
            
            <div className="space-y-1">
              <h2 className="text-5xl md:text-6xl font-serif font-light italic text-gold tracking-wide leading-none">
                Lady Cosméticos
              </h2>
              <p className="text-[10px] tracking-[0.35em] text-white/60 uppercase font-sans font-medium">
                PERFUMES & CROCHÊ
              </p>
            </div>

            <p className="text-sm md:text-base italic text-white/95 font-serif leading-relaxed tracking-wide">
              "Cuidar de si mesma não é um capricho, é um ato de amor-próprio. Que cada aroma desperte sua força e cada detalhe celebre o poder de ser você todos os dias."
            </p>

            <div className="space-y-4 border-l border-gold/30 pl-5 mt-2">
              <p className="text-xs text-white/70 leading-relaxed font-sans font-light tracking-wide">
                <span className="text-gold font-semibold uppercase tracking-wider text-[11px] block md:inline mr-1">O Universo Lady Cosméticos —</span> Acredito que a verdadeira beleza floresce quando cuidamos da nossa autoestima. Meu propósito é trazer acolhimento, cuidado diário e bem-estar através de fragrâncias marcantes e do carinho de peças artesanais feitas à mão.
              </p>
              <p className="text-xs text-white/50 leading-relaxed font-sans font-light tracking-wide">
                Com uma seleção impecável de produtos Natura, O Boticário e crochê exclusivo, oferecemos mais do que produtos: entregamos momentos de carinho e valorização pessoal.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={handleGeneralContact}
                className="px-6 py-3.5 bg-gold text-black hover:bg-gold/90 border border-gold text-xs font-sans font-bold tracking-[0.15em] uppercase transition-all duration-300 cursor-pointer flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-black" /> ENCOMENDAR CONSULTA PARTICULAR
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* IMMERSIVE PRODUCT SPECIFICATION GLASS OVERLAY INSPECT PANEL (DETAILS POPUP) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000]/90 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-2xl bg-[#141414] border border-gold/45 rounded-none p-5 sm:p-8 md:p-10 relative shadow-[0_0_50px_rgba(212,175,55,0.15)] max-h-[90vh] overflow-y-auto md:overflow-visible"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-gold transition-colors text-[9px] font-sans tracking-[0.2em] flex items-center gap-1.5 cursor-pointer uppercase font-semibold"
                id="btn-close-inspect"
              >
                <span>Fechar</span> <X className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mt-6">
                {/* Visual rendering block left - aspect-video on mobile to conserve screen height */}
                <div className="bg-[#0c0c0c] border border-white/10 aspect-video md:aspect-square h-40 sm:h-48 md:h-auto relative flex items-center justify-center p-4 md:p-6 shadow-inner">
                  <ProductVisual id={selectedProduct.id} catalog={selectedProduct.catalog} imageUrl={selectedProduct.imageUrl} />
                </div>

                {/* Technical stats right */}
                <div className="flex flex-col justify-between space-y-4 md:space-y-6">
                  <div className="space-y-3.5 md:space-y-4">
                    <div className="flex items-center justify-between text-[9px] font-sans">
                      <span className="text-gold tracking-[0.2em] font-bold uppercase truncate max-w-[150px]">
                        {selectedProduct.badge}
                      </span>
                      <span className="text-white/40 font-mono font-medium tracking-wide">{selectedProduct.indexNum}</span>
                    </div>

                    <h2 className="text-xl md:text-3xl font-display font-light text-white uppercase tracking-wide leading-tight">
                      {selectedProduct.title}
                    </h2>
                    <p className="text-xs text-white/50 leading-relaxed font-sans tracking-wide font-light">
                      {selectedProduct.description}
                    </p>

                    <div className="bg-[#0c0c0c] border border-white/10 p-3.5 md:p-4 space-y-1.5">
                      <span className="text-[9px] font-sans text-gold/80 font-semibold block tracking-[0.25em] uppercase">
                        {selectedProduct.catalog === 'Croche' ? 'DIRETRIZES TÊXTEIS E FIOS' : 'NOTAS OLFATIVAS DETALHADAS'}
                      </span>
                      <p className="text-[10px] md:text-[11px] font-sans text-white/60 leading-relaxed font-normal">
                        {selectedProduct.notes}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-3.5 md:pt-4 border-t border-white/10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-sans text-white/40 tracking-[0.2em] uppercase font-light">Valor Estimado</span>
                      <span className="text-xl md:text-2xl font-display font-light text-gold tracking-wide underline underline-offset-4 md:underline-offset-8 decoration-gold/20">
                        {selectedProduct.price}
                      </span>
                    </div>

                    <button
                      onClick={() => handleWhatsAppCheckout(selectedProduct)}
                      className="w-full py-3.5 md:py-4 bg-gold hover:bg-gold/95 text-black font-sans font-bold tracking-[0.2em] text-[10px] uppercase transition-all duration-300 pointer-events-auto select-none rounded-none cursor-pointer flex items-center justify-center gap-2 font-black"
                      id="btn-inspect-whatsapp-order"
                    >
                      <MessageCircle className="w-4 h-4 fill-black" strokeWidth="0" /> REALIZAR PEDIDO VIA WHATSAPP
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED ROOT LEVEL ADMIN MODAL CONTROL PORTAL */}
      {isAdminOpen && (
        <AdminPanel
          products={products}
          setProducts={setProducts}
          settings={settings}
          setSettings={setSettings}
          resetToDefault={resetToDefault}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* METALLIC BRUSHED FOOTER DECORATION */}
      <footer className="bg-black py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <h4 className="text-lg font-display font-light text-white tracking-widest uppercase">LADY COSMÉTICOS</h4>
            <p className="text-xs text-white/50 leading-relaxed font-sans tracking-wide font-light">
              O Toque Clássico da Arte Têxtil Fina e a Majestade da Perfumaria de Luxo em conexões intuitivas e exclusivas.
            </p>
            <div className="flex items-center gap-3.5">
              <a href="https://instagram.com" target="_blank" className="p-2 border border-white/10 text-white/40 hover:text-gold hover:border-gold/50 transition-colors">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="p-2 border border-white/10 text-white/40 hover:text-gold hover:border-gold/50 transition-colors">
                <Heart className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-sans text-gold tracking-[0.25em] uppercase mb-5 font-semibold">Produtos Curados</h4>
            <ul className="text-xs font-sans font-light tracking-wide text-white/50 space-y-3">
              <li><a href="#vitrine-catalogo" className="hover:text-gold transition-colors block">Fragrâncias Natura Exclusivas</a></li>
              <li><a href="#vitrine-catalogo" className="hover:text-gold transition-colors block">Fragrâncias O Boticário</a></li>
              <li><a href="#vitrine-catalogo" className="hover:text-gold transition-colors block">Crochês sob Encomenda</a></li>
              <li><a href="#vitrine-catalogo" className="hover:text-gold transition-colors block">Selo Leidy Privé</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-sans text-gold tracking-[0.25em] uppercase mb-5 font-semibold">Compromisso Ético</h4>
            <p className="text-xs text-white/50 leading-relaxed font-sans tracking-wide font-light">
              Este acervo foca exclusivamente na comercialização de perfumaria autêntica de alto padrão. Não fornecemos maquiagens ou cosméticos faciais. Focado 100% no design estético e requinte.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-sans text-gold tracking-[0.25em] uppercase mb-5 font-semibold">Contato Oficial</h4>
            <ul className="text-xs font-sans font-light tracking-wide text-white/50 space-y-2.5 leading-relaxed">
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gold/80" /> {settings.whatsappNumber}</li>
              <li className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gold/80" /> Atendimento Personalizado</li>
              <li className="text-[10px] text-white/30 tracking-wide mt-3 uppercase">© 2026 Lady Cosméticos. Todos os direitos reservados.</li>
            </ul>
          </div>
        </div>

        {/* HIGH-END METRIC AND COUTURE FOOTER PANEL MATCHING EXACT THEME SECTION LAYOUT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="max-w-md text-center md:text-left">
            <div className="text-[9px] text-gold uppercase tracking-[0.25em] mb-2 font-semibold">Project Identity</div>
            <p className="text-[11px] text-white/30 uppercase leading-relaxed tracking-widest font-sans font-light">
              Curadoria técnica em perfumaria de luxo e tapeçaria artesanal de alta costura.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-6 mb-3 select-none">
              <div className="w-1 h-1 bg-white/20 rounded-full"></div>
              <div className="w-1 h-1 bg-[#D4AF37] rounded-full"></div>
              <div className="w-1 h-1 bg-white/20 rounded-full"></div>
            </div>
            <div className="text-[8px] tracking-[0.45em] text-white/20 uppercase font-sans font-light">
              8K UHD RENDERING • HARDWARE ACCELERATED
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
