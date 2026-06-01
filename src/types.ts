/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CatalogType = 'Natura' | 'O Boticario' | 'Croche';

export interface Product {
  id: string;
  catalog: CatalogType;
  title: string;
  description: string;
  badge: string; // Metallic Version Badge / Brand Seal
  indexNum: string; // Project numbering e.g., "01/15"
  price: string; // Price in BRL (e.g., "R$ 289,90" or "Sob Encomenda")
  promotionalPrice?: string; // NOVO: Preço promocional (e.g., "R$ 199,90")
  notes: string; // Fragrance notes or materials/dimensions
  imageUrl: string; // Image placeholder path or generated illustration
  whatsappLink: string; // Predefined click-to-chat text link for quick order routing
}

export interface AdminSettings {
  storeName: string;
  whatsappNumber: string; // The phone number to receive catalog orders
  customGreeting: string; // Greeting text for WhatsApp redirects
  profileImageUrl?: string; // Profile image for Leidy in the About Atelier section
}
