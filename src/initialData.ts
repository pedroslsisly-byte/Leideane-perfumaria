/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, AdminSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // --- NATURA CATALÙGUE (5 Fragrances) ---
  {
    id: 'nat_1',
    catalog: 'Natura',
    title: 'Essencial Único',
    description: 'Uma obra de arte olfativa cocriada por perfumistas franceses renomados.',
    badge: 'NATURA PARFUM PRIVÉ',
    indexNum: '01/15',
    price: 'R$ 294,90',
    notes: 'Copaíba preciosa purificada, combinada com o calor do Vetiver e notas de Âmbar profundo.',
    imageUrl: 'perfume_gold_tall',
    whatsappLink: 'Olá Leidy! Desejo encomendar o Essencial Único Natura (01/15) por R$ 294,90'
  },
  {
    id: 'nat_2',
    catalog: 'Natura',
    title: 'Homem Dom',
    description: 'O contraste marcante entre o calor dos ingredientes nobres e a sofisticação da Baunilha Negra.',
    badge: 'NATURA ESSENTIALS',
    indexNum: '02/15',
    price: 'R$ 199,90',
    notes: 'Priprioca rústica da Amazônia, Baunilha Negra, Sândalo indiano e notas de couro refinado.',
    imageUrl: 'perfume_obsidian_block',
    whatsappLink: 'Olá Leidy! Gostaria do Homem Dom Natura (02/15) por R$ 199,90'
  },
  {
    id: 'nat_3',
    catalog: 'Natura',
    title: 'Ilía Ser',
    description: 'Uma fragrância sofisticada que celebra a força e o mistério feminino contemporâneo.',
    badge: 'NATURA FEMME OR',
    indexNum: '03/15',
    price: 'R$ 174,90',
    notes: 'Buquê floral expressivo de Jasmim, fundido à riqueza do Patchouli premium e fava de Ambar.',
    imageUrl: 'perfume_bronze_ellipse',
    whatsappLink: 'Olá Leidy! Tenho interesse no Ilía Ser Natura (03/15) por R$ 174,90'
  },
  {
    id: 'nat_4',
    catalog: 'Natura',
    title: 'Luna Valentia',
    description: 'O chipre brasileiro mais ousado e sofisticado, combinando florais exuberantes com patchouli.',
    badge: 'NATURA COLLECTION',
    indexNum: '04/15',
    price: 'R$ 189,90',
    notes: 'Flor de Metamorfose amazônica, Patchouli precioso, Pimenta-rosa fresca e Cassis silvestre.',
    imageUrl: 'perfume_gold_flat',
    whatsappLink: 'Olá Leidy! Desejo adquirir o Luna Valentia Natura (04/15) por R$ 189,90'
  },
  {
    id: 'nat_5',
    catalog: 'Natura',
    title: 'Una Artisan',
    description: 'A harmonia perfeita entre a cremosidade das flores brancas e o calor das madeiras de patchouli.',
    badge: 'NATURA HAUTE COUTURE',
    indexNum: '05/15',
    price: 'R$ 265,00',
    notes: 'Patchouli premium, Baunilha madura, Mandarina fresca e pétalas de Rosa damascena.',
    imageUrl: 'perfume_rose_gold_cylinder',
    whatsappLink: 'Olá Leidy! Quero detalhes do Una Artisan Natura (05/15) por R$ 265,00'
  },

  // --- O BOTICÁRIO CATALÙGUE (5 Fragrances) ---
  {
    id: 'bot_1',
    catalog: 'O Boticario',
    title: 'Malbec Black',
    description: 'A potência máxima de Malbec extraída do álcool vínico envelhecido em barris franceses de carvalho.',
    badge: 'BOTICÁRIO BLACK LINE',
    indexNum: '06/15',
    price: 'R$ 229,90',
    notes: 'Acordos de Whisky turfado, Âmbar escuro vulcânico, Sândalo e notas especiadas de pimenta-preta.',
    imageUrl: 'perfume_pitch_black',
    whatsappLink: 'Olá Leidy! Gostaria do Malbec Black O Boticário (06/15) por R$ 229,90'
  },
  {
    id: 'bot_2',
    catalog: 'O Boticario',
    title: 'Lily Eau de Parfum',
    description: 'Fragrância floral icônica obtida através do raro processo de enfleurage das pétalas de Lírio.',
    badge: 'BOTICÁRIO OR EXTRAIT',
    indexNum: '07/15',
    price: 'R$ 289,90',
    notes: 'Lírios de São José, Mandarina espanhola, Pêssego aveludado, Baunilha e Almíscar sedoso.',
    imageUrl: 'perfume_crystal_gold',
    whatsappLink: 'Olá Leidy! Desejo o luxuoso Lily Eau de Parfum O Boticário (07/15) por R$ 289,90'
  },
  {
    id: 'bot_3',
    catalog: 'O Boticario',
    title: 'Elysée Succès',
    description: 'Uma fragrância opulenta que celebra a audácia feminina com sofisticação extrema de longa duração.',
    badge: 'BOTICÁRIO PRESTIGE',
    indexNum: '08/15',
    price: 'R$ 299,90',
    notes: 'Rosa Negra de Grasse, Oud nobre, Patchouli de Singapura e fava de Baunilha Gourmet quente.',
    imageUrl: 'perfume_jewelry_glass',
    whatsappLink: 'Olá Leidy! Tenho grande interesse no Elysée Succès O Boticário (08/15) por R$ 299,90'
  },
  {
    id: 'bot_4',
    catalog: 'O Boticario',
    title: 'Zaad Santal',
    description: 'A sofisticação do Sândalo em contraste com o frescor de notas aromáticas importadas da Europa.',
    badge: 'BOTICÁRIO MONDE',
    indexNum: '09/15',
    price: 'R$ 284,90',
    notes: 'Sândalo da Nova Caledônia, Noz-moscada fresca, Gengibre azul e Cedro do atlas.',
    imageUrl: 'perfume_brushed_metal_cylinder',
    whatsappLink: 'Olá Leidy! Quero reservar o Zaad Santal O Boticário (09/15) por R$ 284,90'
  },
  {
    id: 'bot_5',
    catalog: 'O Boticario',
    title: 'Floratta Red',
    description: 'Uma fragrância doce e sensual inspirada na rara flor da Maçã de Vermont, ideal para seduzir.',
    badge: 'BOTICÁRIO SÉDUCTION',
    indexNum: '10/15',
    price: 'R$ 149,90',
    notes: 'Maçã fresca de Vermont, Flor de Amora, Jasmim Sambac e nuances de Chocolate Amargo.',
    imageUrl: 'perfume_scarlet_globe',
    whatsappLink: 'Olá Leidy! Gostaria de encomendar o Floratta Red O Boticário (10/15) por R$ 149,90'
  },

  // --- CROCHET ARTISTRY (5 Masterpieces) ---
  {
    id: 'cro_1',
    catalog: 'Croche',
    title: 'Tapete Imperial de Luxo',
    description: 'Peça monumental de alto relevo trabalhada inteiramente à mão com cordão de algodão egípcio.',
    badge: 'LEIDY CROCHÊ ATELIER',
    indexNum: '11/15',
    price: 'R$ 380,00',
    notes: '1.20m x 0.80m | Algodão 100% Orgânico nº 8 | Trama dupla com bico rendado imperial.',
    imageUrl: 'crochet_mandala',
    whatsappLink: 'Olá Leidy! Estou apaixonada pelo Tapete Imperial de Crochê (11/15) por R$ 380,00'
  },
  {
    id: 'cro_2',
    catalog: 'Croche',
    title: 'Manta Sofá Elegance',
    description: 'Manta luxuosa de toque ultra-macio e caimento perfeito para salas refinadas.',
    badge: 'LEIDY CROCHÊ ATELIER',
    indexNum: '12/15',
    price: 'R$ 620,00',
    notes: '1.80m x 1.40m | Fio Mercerizado duplo em Bronze Metálico | Ponto colmeia geométrico.',
    imageUrl: 'crochet_weave_blanket',
    whatsappLink: 'Olá Leidy! Desejo encomendar a Manta de Sofá Elegance em Crochê (12/15) por R$ 620,00'
  },
  {
    id: 'cro_3',
    catalog: 'Croche',
    title: 'Bolsa Golden Hour',
    description: 'Bolsa de festa artesanal estruturada com alças de metal dourado e fecho magnético luxo.',
    badge: 'LEIDY CROCHÊ PREMIUM',
    indexNum: '13/15',
    price: 'R$ 290,00',
    notes: 'Largura: 24cm, Altura: 16cm | Fio Náutico Premium Acetinado | Correntes e fechos banhados a ouro.',
    imageUrl: 'crochet_bag_gold',
    whatsappLink: 'Olá Leidy! Quero adquirir a Bolsa Golden Hour em Crochê (13/15) por R$ 290,00'
  },
  {
    id: 'cro_4',
    catalog: 'Croche',
    title: 'Centro de Mesa Vintage',
    description: 'Centro de mesa em renda francesa com simetria fractal inspirada em designs folclóricos europeus.',
    badge: 'LEIDY CROCHÊ PREMIUM',
    indexNum: '14/15',
    price: 'R$ 220,00',
    notes: 'Diâmetro: 85cm | Linha de seda pura mercerizada | Tom bege off-white com reflexos ouro.',
    imageUrl: 'crochet_classic_lace',
    whatsappLink: 'Olá Leidy! Quero reservar o Centro de Mesa Vintage em Crochê (14/15) por R$ 220,00'
  },
  {
    id: 'cro_5',
    catalog: 'Croche',
    title: 'Jogo de Banheiro Realeza',
    description: 'Jogo completo de 3 peças em trama fechada ultra absorvente e contornos dourados refinados.',
    badge: 'LEIDY CROCHÊ ATELIER',
    indexNum: '15/15',
    price: 'R$ 450,00',
    notes: '3 Unidades | Algodão encorpado nº 8 com corda de contorno metalizada resistente.',
    imageUrl: 'crochet_royalty_bath',
    whatsappLink: 'Olá Leidy! Gostaria do Jogo de Banheiro Realeza em Crochê (15/15) por R$ 450,00'
  }
];

export const DEFAULT_SETTINGS: AdminSettings = {
  storeName: 'Lady Cosméticos - Perfumaria & Crochê Premium',
  whatsappNumber: '5591985054580', // Active number for Lady Cosméticos
  customGreeting: 'Olá! Conheci seu catálogo de luxo da Lady Cosméticos e adorei as peças.',
  profileImageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600' // Elegant default reference image representing Leidy
};
