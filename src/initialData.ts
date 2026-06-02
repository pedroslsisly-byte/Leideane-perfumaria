/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, AdminSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const DEFAULT_SETTINGS: AdminSettings = {
  storeName: 'Leide Cosméticos - Perfumaria & Crochê Premium',
  whatsappNumber: '5591985054580', // Active number for Leide Cosméticos
  customGreeting: 'Olá! Conheci seu catálogo de luxo da Leide Cosméticos e adorei as peças.',
  profileImageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600' // Elegant default reference image representing Leide
};
