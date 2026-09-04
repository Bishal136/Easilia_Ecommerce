import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nerob_ecommerce';

async function seedOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure Buyers exist
    let buyer1 = await User.findOne({ email: 'bishalbiswas2027@gmail.com' });
    if (!buyer1) {
      buyer1 = await User.create({
        name: 'Bishal Biswas',
        email: 'bishalbiswas2027@gmail.com',
        phone: '+8801700000001',
        password: '$2a$12$0kL7Q4QzQoR/p98y0U3eF.K6qWbEaUe.s7mDqA3X3D8vQ7o1iW3r6',
        role: 'user',
        isVerified: true,
      });
      console.log('Created buyer1: Bishal Biswas');
    }

    let buyer2 = await User.findOne({ email: 'testuser1@gmail.com' });
    if (!buyer2) {
      buyer2 = await User.create({
        name: 'Test User 1',
        email: 'testuser1@gmail.com',
        phone: '+8801700000002',
        password: '$2a$12$0kL7Q4QzQoR/p98y0U3eF.K6qWbEaUe.s7mDqA3X3D8vQ7o1iW3r6',
        role: 'user',
        isVerified: true,
      });
      console.log('Created buyer2: Test User 1');
    }

    // 2. Ensure Shops exist
    let shop1 = await Shop.findOne({ name: "Bishal Biswas's Shop" });
    if (!shop1) {
      shop1 = await Shop.create({
        name: "Bishal Biswas's Shop",
        slug: 'bishal-biswass-shop',
        owner: buyer1._id,
        phone: '+8801700000001',
        email: 'bishalbiswas2027@gmail.com',
        location: { type: 'Point', coordinates: [90.4125, 23.8103] },
        kycStatus: 'approved',
        status: 'active',
      });
    }

    let shop2 = await Shop.findOne({ name: 'Marketplace Seller' });
    if (!shop2) {
      shop2 = await Shop.create({
        name: 'Marketplace Seller',
        slug: 'marketplace-seller',
        owner: buyer2._id,
        phone: '+8801700000002',
        email: 'testuser1@gmail.com',
        location: { type: 'Point', coordinates: [90.4125, 23.8103] },
        kycStatus: 'approved',
        status: 'active',
      });
    }

    // 3. Ensure Category & Product exist
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({
        name: 'Electronics & Computers',
        slug: 'electronics-computers',
        order: 1,
      });
    }

    let product1 = await Product.findOne({ shop: shop1._id });
    if (!product1) {
      product1 = await Product.create({
        title: 'Mechanical Gaming Keyboard RGB',
        slug: 'mechanical-gaming-keyboard-rgb-' + Date.now(),
        description: 'High performance mechanical keyboard with blue switches.',
        category: category._id,
        shop: shop1._id,
        basePrice: 2200,
        price: 2200,
        totalStock: 50,
        images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300', path: '' }],
      });
    }

    let product2 = await Product.findOne({ shop: shop2._id });
    if (!product2) {
      product2 = await Product.create({
        title: 'USB Type-C Fast Charging Cable',
        slug: 'usb-type-c-fast-charging-cable-' + Date.now(),
        description: 'Durable nylon braided Type-C cable.',
        category: category._id,
        shop: shop2._id,
        basePrice: 55,
        price: 55,
        totalStock: 100,
        images: [{ url: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=300', path: '' }],
      });
    }

    // Check count of existing orders
    const existingOrdersCount = await Order.countDocuments();
    console.log(`Current orders in DB: ${existingOrdersCount}`);

    if (existingOrdersCount < 5) {
      const ordersToSeed = [
        {
          orderNumber: '2CD872F7',
          user: buyer1._id,
          items: [
            {
              product: product1._id,
              shop: shop1._id,
              quantity: 1,
              price: 2200,
              itemStatus: 'pending',
            },
          ],
          shippingAddress: {
            fullName: 'Bishal Biswas',
            phone: '+8801700000001',
            street: '123 Tech Avenue, Block B',
            city: 'Dhaka',
            state: 'Dhaka Division',
            zipCode: '1212',
            country: 'Bangladesh',
          },
          paymentMethod: 'portpos',
          paymentStatus: 'pending',
          orderStatus: 'pending',
          subtotal: 2200,
          shippingCost: 0,
          totalPrice: 2200,
          createdAt: new Date('2026-08-26T23:08:00.000Z'),
        },
        {
          orderNumber: '2CD872A4',
          user: buyer1._id,
          items: [
            {
              product: product2._id,
              shop: shop2._id,
              quantity: 1,
              price: 55,
              itemStatus: 'pending',
            },
          ],
          shippingAddress: {
            fullName: 'Bishal Biswas',
            phone: '+8801700000001',
            street: '123 Tech Avenue, Block B',
            city: 'Dhaka',
            state: 'Dhaka Division',
            zipCode: '1212',
            country: 'Bangladesh',
          },
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          orderStatus: 'pending',
          subtotal: 55,
          shippingCost: 0,
          totalPrice: 55,
          createdAt: new Date('2026-08-26T23:08:00.000Z'),
        },
        {
          orderNumber: '2CD8729D',
          user: buyer1._id,
          items: [
            {
              product: product1._id,
              shop: shop1._id,
              quantity: 1,
              price: 2200,
              itemStatus: 'pending',
            },
            {
              product: product2._id,
              shop: shop1._id,
              quantity: 2,
              price: 425,
              itemStatus: 'pending',
            },
          ],
          shippingAddress: {
            fullName: 'Bishal Biswas',
            phone: '+8801700000001',
            street: '123 Tech Avenue, Block B',
            city: 'Dhaka',
            state: 'Dhaka Division',
            zipCode: '1212',
            country: 'Bangladesh',
          },
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          orderStatus: 'pending',
          subtotal: 3050,
          shippingCost: 0,
          totalPrice: 3050,
          createdAt: new Date('2026-08-26T23:08:00.000Z'),
        },
        {
          orderNumber: '727F3039',
          user: buyer2._id,
          items: [
            {
              product: product1._id,
              shop: shop1._id,
              quantity: 2,
              price: 2200,
              itemStatus: 'delivered',
            },
          ],
          shippingAddress: {
            fullName: 'Test User 1',
            phone: '+8801700000002',
            street: '45 Lake View Road',
            city: 'Chittagong',
            state: 'Chittagong Division',
            zipCode: '4000',
            country: 'Bangladesh',
          },
          paymentMethod: 'portpos',
          paymentStatus: 'pending',
          orderStatus: 'delivered',
          subtotal: 4400,
          shippingCost: 0,
          totalPrice: 4400,
          deliveredAt: new Date('2026-08-25T07:12:00.000Z'),
          createdAt: new Date('2026-08-25T07:12:00.000Z'),
        },
        {
          orderNumber: '61809A55',
          user: buyer1._id,
          items: [
            {
              product: product2._id,
              shop: shop1._id,
              quantity: 1,
              price: 450,
              itemStatus: 'delivered',
            },
          ],
          shippingAddress: {
            fullName: 'Bishal Biswas',
            phone: '+8801700000001',
            street: '123 Tech Avenue, Block B',
            city: 'Dhaka',
            state: 'Dhaka Division',
            zipCode: '1212',
            country: 'Bangladesh',
          },
          paymentMethod: 'cod',
          paymentStatus: 'paid',
          orderStatus: 'delivered',
          subtotal: 450,
          shippingCost: 0,
          totalPrice: 450,
          deliveredAt: new Date('2026-08-23T16:21:00.000Z'),
          createdAt: new Date('2026-08-23T16:21:00.000Z'),
        },
      ];

      for (const ord of ordersToSeed) {
        const exists = await Order.findOne({ orderNumber: ord.orderNumber });
        if (!exists) {
          await Order.create(ord);
          console.log(`Seeded Order #${ord.orderNumber}`);
        }
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedOrders();
