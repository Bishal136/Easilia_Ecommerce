import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Banner from '../models/Banner.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nerob_ecommerce';

async function seedBanners() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Banner Seeding');

    const sampleBanners = [
      {
        title: 'Discover the Latest Deals – Up to 50% Off!',
        subtitle: 'Shop trending fashion, high-end electronics & daily lifestyle essentials.',
        image: {
          url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
          path: '',
        },
        link: '/products',
        position: 'home_hero',
        priority: 10,
        isActive: true,
      },
      {
        title: 'Next-Gen Tech & Electronics – Mega Flash Deals!',
        subtitle: 'Upgrade your gadgets with exclusive limited-time discounts.',
        image: {
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80',
          path: '',
        },
        link: '/products?category=electronic',
        position: 'home_hero',
        priority: 5,
        isActive: true,
      },
      {
        title: 'Men\'s Premium Winter Fashion Collection',
        subtitle: 'New Year! New Fashion',
        image: {
          url: 'https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=600',
          path: '',
        },
        link: '/products?category=fashion',
        position: 'home_middle',
        priority: 3,
        isActive: true,
      },
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

    for (const b of sampleBanners) {
      const exists = await Banner.findOne({ title: b.title });
      if (!exists) {
        await Banner.create(b);
        console.log(`Created banner: ${b.title}`);
      }
    }

    console.log('Banners seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Banner seeding error:', err);
    process.exit(1);
  }
}

seedBanners();
