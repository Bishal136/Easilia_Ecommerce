import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Banner from '../models/Banner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nerob_ecommerce';

export const sampleBanners = [
  // 1. Hero Slider Carousel
  {
    title: 'Discover the Latest Deals –',
    subtitle: 'Up to 50% Off!',
    image: {
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    buttonText: 'Shop Now',
    position: 'home_hero',
    priority: 10,
    isActive: true,
  },
  {
    title: 'Next-Gen Tech & Electronics –',
    subtitle: 'Mega Flash Deals!',
    image: {
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    buttonText: 'Shop Now',
    position: 'home_hero',
    priority: 5,
    isActive: true,
  },

  // 2. Top Row Promo Cards:
  // 2.1 Feature Card (Winter Fashion)
  {
    title: 'New Year! New Fashion',
    subtitle: "Men's Premium Winter Collection",
    image: {
      url: 'https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=800&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    buttonText: 'Shop Now',
    position: 'promo_feature_1',
    priority: 1,
    isActive: true,
  },

  // 2.2 Gaming Accessories 4-Grid Box
  {
    title: 'Gaming accessories',
    subtitle: 'Level up your battle station',
    image: {
      url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    buttonText: 'See more',
    position: 'promo_gaming',
    priority: 1,
    isActive: true,
    subItems: [
      {
        title: 'Headsets',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
        link: '/products?category=electronics',
      },
      {
        title: 'Mouse',
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
        link: '/products?category=electronics',
      },
      {
        title: 'Controller',
        image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=400&auto=format&fit=crop&q=80',
        link: '/products?category=electronics',
      },
      {
        title: 'Chair',
        image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&auto=format&fit=crop&q=80',
        link: '/products?category=electronics',
      },
    ],
  },

  // 2.3 Stack Cards (Winner PC, Redmi Y3, Philips TV)
  {
    title: 'BE THE WINNER',
    subtitle: 'Pro Gaming Rig System',
    badge: '৳1,990',
    buttonText: 'More details',
    image: {
      url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    position: 'promo_stack',
    priority: 3,
    isActive: true,
  },
  {
    title: 'Redmi Y3 NEW! Blue',
    subtitle: 'Crisp Performance & Display',
    badge: 'NEW',
    buttonText: 'Shop Now',
    image: {
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    position: 'promo_stack',
    priority: 2,
    isActive: true,
  },
  {
    title: 'Philips 4K Ambilight TV',
    subtitle: 'Immersive entertainment experience',
    badge: '৳250 OFF',
    priceTag: '৳750',
    buttonText: 'Shop Now',
    image: {
      url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    position: 'promo_stack',
    priority: 1,
    isActive: true,
  },

  // 3. 4-Banner Promo Strip
  {
    title: 'Comfy Fit / Trousers Fashion',
    subtitle: 'Daily comfort & modern cut',
    buttonText: 'Shop Now',
    image: {
      url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_strip',
    priority: 4,
    isActive: true,
  },
  {
    title: "MEN'S FASHION Watch",
    subtitle: 'Timeless luxury craftsmanship',
    buttonText: 'Shop Now',
    image: {
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_strip',
    priority: 3,
    isActive: true,
  },
  {
    title: 'DENIM Collection',
    subtitle: 'Authentic wash & durable denim wear',
    buttonText: 'See more',
    image: {
      url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_strip',
    priority: 2,
    isActive: true,
  },
  {
    title: 'PHILIPS Domestic Appliances',
    subtitle: 'Smart home essentials for easy living',
    buttonText: 'Shop Now',
    image: {
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    position: 'promo_strip',
    priority: 1,
    isActive: true,
  },

  // 4. Trending Section Box ("Trend collection for men")
  {
    title: 'Trend collection for men',
    subtitle: 'Handpicked seasonal men style',
    buttonText: 'View All',
    image: {
      url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_trend',
    priority: 1,
    isActive: true,
    subItems: [
      {
        title: 'Cargo Pants',
        badge: '20% off',
        price: '৳250',
        image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=400&auto=format&fit=crop&q=80',
        link: '/products',
      },
      {
        title: 'Minimal Black Tee',
        badge: 'Trending',
        price: '৳180',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80',
        link: '/products',
      },
      {
        title: 'Red Running Sneakers',
        badge: 'Sale',
        price: '৳1,040',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
        link: '/products',
      },
      {
        title: 'Casual Military Cap',
        badge: 'Popular',
        price: '৳105',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&auto=format&fit=crop&q=80',
        link: '/products',
      },
    ],
  },

  // 5. Best Selling Collage Grid (5 cards)
  {
    title: 'Computer Accessories',
    subtitle: 'High performance PC hardware',
    badge: 'COMING SOON',
    buttonText: 'Visit store',
    image: {
      url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    position: 'promo_bestseller_grid',
    priority: 5,
    isActive: true,
  },
  {
    title: "Men's Urban Jackets",
    subtitle: 'Streetwear essentials',
    badge: '৳200',
    priceTag: '৳200',
    buttonText: 'Visit store',
    image: {
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_bestseller_grid',
    priority: 4,
    isActive: true,
  },
  {
    title: 'Pomegranate Fresh Juice',
    subtitle: 'Pure cold-pressed organic juice',
    badge: '৳49',
    priceTag: '৳49',
    buttonText: 'Buy now',
    image: {
      url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_bestseller_grid',
    priority: 3,
    isActive: true,
  },
  {
    title: 'AI Smart Surveillance Camera',
    subtitle: 'Full 360 security vision',
    badge: '৳420',
    priceTag: '৳420',
    buttonText: 'Visit store',
    image: {
      url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products?category=electronics',
    position: 'promo_bestseller_grid',
    priority: 2,
    isActive: true,
  },
  {
    title: 'Premium Cosmetic Treatment',
    subtitle: 'Luxury hydration & glow',
    badge: '৳149',
    priceTag: '৳149',
    buttonText: 'Buy Now',
    image: {
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_bestseller_grid',
    priority: 1,
    isActive: true,
  },

  // 6. Best Selling Tall Banner
  {
    title: 'DOG FOOD MADE WITH LOVE',
    subtitle: 'WE LOVE DOGS',
    badge: '15% OFF',
    buttonText: 'Shop Now',
    image: {
      url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
      path: '',
    },
    link: '/products',
    position: 'promo_bestseller_tall',
    priority: 1,
    isActive: true,
  },

  // 7. Storefront Announcement Ticker
  {
    title: '⚡ Special Deal: Free delivery on orders over ৳2,000! Use code DEALPORT',
    subtitle: 'Storefront Announcement',
    image: {
      url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
      path: '',
    },
    link: '/products',
    position: 'ticker',
    priority: 1,
    isActive: true,
  },
];

async function seedBanners() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Banner Seeding');

    // 1. Sanitize any existing banners with $ to ৳
    const existing = await Banner.find({});
    for (const eb of existing) {
      let modified = false;
      if (eb.badge && eb.badge.includes('$')) {
        eb.badge = eb.badge.replace(/\$/g, '৳');
        modified = true;
      }
      if (eb.priceTag && eb.priceTag.includes('$')) {
        eb.priceTag = eb.priceTag.replace(/\$/g, '৳');
        modified = true;
      }
      if (Array.isArray(eb.subItems)) {
        eb.subItems.forEach((sub) => {
          if (sub.price && sub.price.includes('$')) {
            sub.price = sub.price.replace(/\$/g, '৳');
            modified = true;
          }
        });
      }
      if (modified) {
        await eb.save();
        console.log(`Sanitized banner currency for: ${eb.title}`);
      }
    }

    // 2. Upsert standard sample banners
    for (const b of sampleBanners) {
      const exists = await Banner.findOne({ title: b.title, position: b.position });
      if (exists) {
        await Banner.findByIdAndUpdate(exists._id, b, { new: true });
        console.log(`Updated banner: ${b.title} [${b.position}]`);
      } else {
        await Banner.create(b);
        console.log(`Created banner: ${b.title} [${b.position}]`);
      }
    }

    console.log(`Banners seeded and sanitized successfully! Total: ${sampleBanners.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Banner seeding error:', err);
    process.exit(1);
  }
}

seedBanners();

