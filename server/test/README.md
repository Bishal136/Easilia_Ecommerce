# Nerob Ecommerce — Backend Testing & Postman Guide

This directory contains the complete automated test suite and Postman API collection for the **Nerob Multi-Vendor Ecommerce Platform**.

---

## 📁 Files in This Directory

- **[`Nerob_Ecommerce_API.postman_collection.json`](Nerob_Ecommerce_API.postman_collection.json)**: Complete Postman collection containing 50+ API requests across all 16 backend modules.
- **[`Nerob_Ecommerce_Environment.postman_environment.json`](Nerob_Ecommerce_Environment.postman_environment.json)**: Ready-to-use Postman environment variables for local testing.
- **[`backend_e2e_test.js`](backend_e2e_test.js)**: Automated End-to-End backend test runner.

---

## 🚀 How to Import into Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop or select:
   - `server/test/Nerob_Ecommerce_API.postman_collection.json`
   - `server/test/Nerob_Ecommerce_Environment.postman_environment.json`
4. In the top right environment dropdown, select **"Nerob Ecommerce — Local Environment"**.

---

## ⚡ Automated Token Management in Postman

When you execute **Register Buyer**, **Register Seller**, or **Login User**, the Postman collection includes automated test scripts that dynamically save:
- `{{access_token}}`
- `{{buyer_token}}`
- `{{seller_token}}`
- `{{shop_id}}`

All subsequent authenticated endpoints will automatically use these tokens without manual copy-pasting.

---

## 🧪 Running Automated Backend Tests

You can run the full automated backend test suite directly from the `server/` directory:

```bash
npm test
```
*(or `node test/backend_e2e_test.js`)*
