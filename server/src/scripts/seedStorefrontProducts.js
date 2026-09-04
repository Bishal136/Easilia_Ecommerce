import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Shop from '../models/Shop.js';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nerob_ecommerce';

async function seedStorefrontProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Storefront Seeding');

    // 1. Get or create Shop & Owner
    let user = await User.findOne({ role: 'seller' });
    if (!user) {
      user = await User.findOne({ role: 'admin' });
    }

    let shop = await Shop.findOne();
    if (!shop && user) {
      shop = await Shop.create({
        name: 'DealPort Official Store',
        slug: 'dealport-official-store',
        owner: user._id,
        phone: '+8801700000001',
        email: 'store@dealport.com',
        location: { type: 'Point', coordinates: [90.4125, 23.8103] },
        kycStatus: 'approved',
        status: 'active',
      });
    }

    // 2. Categories
    const categoriesData = [
      { name: 'Grocery', slug: 'grocery', icon: '🧺', image: { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300', path: '' } },
      { name: 'Home', slug: 'home', icon: '🛋️', image: { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300', path: '' } },
      { name: 'Fashion', slug: 'fashion', icon: '👔', image: { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300', path: '' } },
      { name: 'Electronic', slug: 'electronic', icon: '💻', image: { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', path: '' } },
      { name: 'Toys', slug: 'toys', icon: '🧸', image: { url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300', path: '' } },
      { name: 'Beauty', slug: 'beauty', icon: '💄', image: { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300', path: '' } },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let existing = await Category.findOne({ slug: cat.slug });
      if (!existing) {
        existing = await Category.create(cat);
      } else {
        existing.image = cat.image;
        await existing.save();
      }
      categoryMap[cat.slug] = existing._id;
    }

    // 3. Products
    const sampleProducts = [
      // Trending
      {
        title: 'Radiant Glow Hydrating Serum',
        slug: 'radiant-glow-hydrating-serum',
        description: 'Gentle yet effective, our Radiance Boosting Foaming Serum hydrates and protects skin all day.',
        basePrice: 39.99,
        discountPrice: 29.99,
        category: categoryMap['beauty'] || categoryMap['grocery'],
        images: [{ url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 50,
      },
      {
        title: 'Modern Minimalist Vase',
        slug: 'modern-minimalist-vase',
        description: 'Gentle yet effective, our Radiance Boosting Foaming handcrafted ceramic vase elevates any room.',
        basePrice: 40.99,
        discountPrice: 40.99,
        category: categoryMap['home'],
        images: [{ url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 30,
      },
      {
        title: 'FitPro 3000 Smartwatch',
        slug: 'fitpro-3000-smartwatch',
        description: 'Gentle yet effective, our Radiance Boosting Foaming smartwatch tracks heart rate and fitness.',
        basePrice: 149.99,
        discountPrice: 119.99,
        category: categoryMap['electronic'],
        images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 80,
      },

      // Limited-Time Deals
      {
        title: 'Samsung Galaxy S24',
        slug: 'samsung-galaxy-s24',
        description: 'Gentle yet effective, our Radiance Boosting Foaming flagship AI smartphone.',
        basePrice: 1100.99,
        discountPrice: 799.99,
        category: categoryMap['electronic'],
        images: [{ url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 45,
      },
      {
        title: 'Ui Tws 7002 Earbud',
        slug: 'ui-tws-7002-earbud',
        description: 'Gentle yet effective, our Radiance Boosting Foaming wireless noise cancelling earbuds.',
        basePrice: 200.00,
        discountPrice: 149.00,
        category: categoryMap['electronic'],
        images: [{ url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 60,
      },
      {
        title: 'Winter fashion jacket',
        slug: 'winter-fashion-jacket',
        description: 'Gentle yet effective, our Radiance Boosting Foaming winter hooded windproof jacket.',
        basePrice: 500.00,
        discountPrice: 250.99,
        category: categoryMap['fashion'],
        images: [{ url: 'https://images.unsplash.com/photo-1544022613-e87ce7526edb?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 40,
      },
      {
        title: 'New Balance 574 Senekers',
        slug: 'new-balance-574-senekers',
        description: 'Gentle yet effective, our Radiance Boosting Foaming classic retro lifestyle sneakers.',
        basePrice: 400.00,
        discountPrice: 300.00,
        category: categoryMap['fashion'],
        images: [{ url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 75,
      },
      {
        title: 'Ui Tws 7002',
        slug: 'ui-tws-7002-mini',
        description: 'Gentle yet effective, our Radiance Boosting Foaming compact wireless sound earbuds.',
        basePrice: 79.99,
        discountPrice: 49.99,
        category: categoryMap['electronic'],
        images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', path: '' }],
        isFeatured: true,
        ratings: 5.0,
        numReviews: 342,
        totalStock: 90,
      },
    ];

    for (const p of sampleProducts) {
      const exists = await Product.findOne({ slug: p.slug });
      if (!exists) {
        await Product.create({
          ...p,
          shop: shop?._id,
        });
        console.log(`Created product: ${p.title}`);
      }
    }

    console.log('Storefront products seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Storefront seeding error:', err);
    process.exit(1);
  }
}

seedStorefrontProducts();
