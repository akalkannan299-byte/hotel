import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import pool from './config/db.js';
import { requireAdmin } from './middleware/adminAuth.js';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const categories = `SELECT category_id, category_name, description FROM categories WHERE is_active = TRUE ORDER BY category_id`;
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/menu', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let sql = `SELECT m.item_id, m.item_name, m.description, m.price, m.image_url, m.is_available,
                      c.category_name
               FROM menu_items m JOIN categories c ON c.category_id=m.category_id
               WHERE c.is_active=TRUE`;
    const args = [];
    if (category && category !== 'All') { sql += ' AND c.category_name=?'; args.push(category); }
    if (search) { sql += ' AND (m.item_name LIKE ? OR m.description LIKE ?)'; args.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY c.category_id, m.item_name';
    const [rows] = await pool.execute(sql, args);
    res.json({ items: rows });
  } catch (e) { next(e); }
});

app.get('/api/menu/category/:category', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.item_id, m.item_name, m.description, m.price, m.image_url, m.is_available, c.category_name
       FROM menu_items m JOIN categories c ON c.category_id=m.category_id
       WHERE c.category_name=? AND c.is_active=TRUE ORDER BY m.item_name`, [req.params.category]);
    res.json({ items: rows });
  } catch (e) { next(e); }
});

app.get('/api/menu/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.item_id, m.item_name, m.description, m.price, m.image_url, m.is_available, c.category_name
       FROM menu_items m JOIN categories c ON c.category_id=m.category_id WHERE m.item_id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Menu item not found.' });
    res.json({ item: rows[0] });
  } catch (e) { next(e); }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  if (username !== expectedUser || password !== expectedPassword) {
    return res.status(401).json({ message: 'Incorrect username or password.' });
  }
  // Demo token only. Use proper sessions/JWT and rate limiting in a production deployment.
  const token = process.env.DEMO_ADMIN_TOKEN || 'demo-admin-token-change-before-deployment';
  res.json({ token, message: 'Signed in for demo administration.' });
});

app.post('/api/menu', requireAdmin, async (req, res, next) => {
  try {
    const { category_name, item_name, description = '', price, image_url = '' } = req.body || {};
    if (!category_name || !item_name?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Category, item name and a valid non-negative price are required.' });
    }
    const [cats] = await pool.execute('SELECT category_id FROM categories WHERE category_name=? AND is_active=TRUE', [category_name]);
    if (!cats.length) return res.status(400).json({ message: 'Invalid category.' });
    const [result] = await pool.execute(
      'INSERT INTO menu_items (category_id,item_name,description,price,image_url,is_available) VALUES (?,?,?,?,?,TRUE)',
      [cats[0].category_id, item_name.trim(), description, Number(price), image_url]);
    res.status(201).json({ item_id: result.insertId, message: 'Menu item added.' });
  } catch (e) { next(e); }
});

app.put('/api/menu/:id', requireAdmin, async (req, res, next) => {
  try {
    const { item_name, description = '', price, image_url = '', is_available = true } = req.body || {};
    if (!item_name?.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Item name and valid price are required.' });
    }
    const [result] = await pool.execute(
      'UPDATE menu_items SET item_name=?,description=?,price=?,image_url=?,is_available=? WHERE item_id=?',
      [item_name.trim(), description, Number(price), image_url, Boolean(is_available), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Menu item not found.' });
    res.json({ message: 'Menu item updated.' });
  } catch (e) { next(e); }
});

app.delete('/api/menu/:id', requireAdmin, async (req, res, next) => {
  try {
    const [result] = await pool.execute('UPDATE menu_items SET is_available=FALSE WHERE item_id=?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Menu item not found.' });
    res.json({ message: 'Menu item marked unavailable.' });
  } catch (e) { next(e); }
});

app.post('/api/customers', async (req, res, next) => {
  try {
    const { customer_name, phone, email = null } = req.body || {};
    if (!customer_name?.trim() || !/^\+?[0-9\s-]{7,18}$/.test(String(phone || ''))) {
      return res.status(400).json({ message: 'Enter a customer name and valid mobile number.' });
    }
    const [existing] = await pool.execute('SELECT customer_id FROM customers WHERE phone=? ORDER BY customer_id DESC LIMIT 1', [String(phone).trim()]);
    if (existing.length) {
      await pool.execute('UPDATE customers SET customer_name=?, email=COALESCE(?, email) WHERE customer_id=?',
        [customer_name.trim(), email, existing[0].customer_id]);
      return res.json({ customer_id: existing[0].customer_id, message: 'Customer identified.' });
    }
    const [result] = await pool.execute('INSERT INTO customers (customer_name,phone,email) VALUES (?,?,?)',
      [customer_name.trim(), String(phone).trim(), email]);
    res.status(201).json({ customer_id: result.insertId, message: 'Customer registered.' });
  } catch (e) { next(e); }
});

app.post('/api/orders', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { customer_name, phone, email = null, order_type = 'TAKEAWAY', table_number = null,
      special_instructions = '', payment_method = 'CASH', items } = req.body || {};
    if (!customer_name?.trim() || !/^\+?[0-9\s-]{7,18}$/.test(String(phone || ''))) {
      return res.status(400).json({ message: 'Enter a customer name and valid mobile number.' });
    }
    const allowedMethods = ['UPI','CARD','CASH','NET_BANKING','WALLET'];
    if (!allowedMethods.includes(payment_method)) return res.status(400).json({ message: 'Invalid payment method.' });
    if (!['DINE_IN','TAKEAWAY'].includes(order_type)) return res.status(400).json({ message: 'Invalid order type.' });
    if (order_type === 'DINE_IN' && !String(table_number || '').trim()) {
      return res.status(400).json({ message: 'Enter a table number for dine-in orders.' });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return res.status(400).json({ message: 'Your cart is empty or invalid.' });
    }
    const normalized = new Map();
    for (const row of items) {
      const id = Number(row.item_id), quantity = Number(row.quantity);
      if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ message: 'Invalid item or quantity in cart.' });
      }
      normalized.set(id, (normalized.get(id) || 0) + quantity);
    }

    await conn.beginTransaction();
    let customerId;
    const [customers] = await conn.execute('SELECT customer_id FROM customers WHERE phone=? ORDER BY customer_id DESC LIMIT 1 FOR UPDATE', [String(phone).trim()]);
    if (customers.length) {
      customerId = customers[0].customer_id;
      await conn.execute('UPDATE customers SET customer_name=?, email=COALESCE(?,email) WHERE customer_id=?',
        [customer_name.trim(), email, customerId]);
    } else {
      const [customerResult] = await conn.execute('INSERT INTO customers (customer_name,phone,email) VALUES (?,?,?)',
        [customer_name.trim(), String(phone).trim(), email]);
      customerId = customerResult.insertId;
    }

    const ids = [...normalized.keys()];
    const placeholders = ids.map(() => '?').join(',');
    const [menuRows] = await conn.query(
      `SELECT item_id,item_name,price,is_available FROM menu_items WHERE item_id IN (${placeholders}) FOR UPDATE`, ids);
    if (menuRows.length !== ids.length) throw Object.assign(new Error('One or more menu items no longer exist.'), { status: 400 });
    const byId = new Map(menuRows.map(x => [x.item_id, x]));
    let subtotal = 0;
    const orderItems = [];
    for (const [id, quantity] of normalized) {
      const item = byId.get(id);
      if (!item.is_available) throw Object.assign(new Error(`${item.item_name} is currently unavailable.`), { status: 400 });
      const unit = Number(item.price);
      const line = Math.round(unit * quantity * 100) / 100;
      subtotal += line;
      orderItems.push({ id, name: item.item_name, quantity, unit, line });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const tax = 0;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const paymentStatus = payment_method === 'CASH' ? 'PAY_AT_COUNTER' : 'PENDING';

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (customer_id,order_type,table_number,subtotal,tax_amount,discount_amount,total_amount,
       payment_method,payment_status,order_status,special_instructions) VALUES (?,?,?,?,?,?,?,?,?,'RECEIVED',?)`,
      [customerId, order_type, order_type === 'DINE_IN' ? String(table_number).trim() : null, subtotal, tax, 0, total,
        payment_method, paymentStatus, String(special_instructions || '').slice(0, 500)]);
    const orderId = orderResult.insertId;
    for (const item of orderItems) {
      await conn.execute(
        'INSERT INTO order_items (order_id,item_id,item_name_snapshot,quantity,unit_price,line_total) VALUES (?,?,?,?,?,?)',
        [orderId, item.id, item.name, item.quantity, item.unit, item.line]);
    }
    await conn.execute(
      'INSERT INTO payments (order_id,payment_method,amount,transaction_reference,payment_status) VALUES (?,?,?,?,?)',
      [orderId, payment_method, total, payment_method === 'CASH' ? null : `DEMO-${crypto.randomUUID()}`, paymentStatus]);
    await conn.commit();
    res.status(201).json({
      order_id: orderId, subtotal, tax_amount: tax, total_amount: total,
      payment_method, payment_status: paymentStatus, order_status: 'RECEIVED',
      message: 'Order placed successfully.'
    });
  } catch (e) {
    await conn.rollback().catch(() => {});
    next(e);
  } finally { conn.release(); }
});

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.order_id,o.order_type,o.table_number,o.subtotal,o.tax_amount,o.total_amount,o.payment_method,
       o.payment_status,o.order_status,o.special_instructions,o.created_at,c.customer_name,c.phone
       FROM orders o JOIN customers c ON c.customer_id=o.customer_id WHERE o.order_id=?`, [req.params.id]);
    if (!orders.length) return res.status(404).json({ message: 'Order not found.' });
    const [items] = await pool.execute(
      'SELECT item_name_snapshot AS item_name,quantity,unit_price,line_total FROM order_items WHERE order_id=? ORDER BY order_item_id', [req.params.id]);
    res.json({ order: orders[0], items });
  } catch (e) { next(e); }
});

app.get('/api/orders/lookup/:phone', async (req, res, next) => {
  try {
    const phone = String(req.params.phone || '').trim();
    if (!/^\+?[0-9\s-]{7,18}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid mobile number.' });
    const [orders] = await pool.execute(
      `SELECT o.order_id,o.total_amount,o.payment_method,o.payment_status,o.order_status,o.created_at
       FROM orders o JOIN customers c ON c.customer_id=o.customer_id WHERE c.phone=? ORDER BY o.created_at DESC LIMIT 50`, [phone]);
    res.json({ orders });
  } catch (e) { next(e); }
});

app.patch('/api/orders/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const allowed = ['RECEIVED','PREPARING','READY','COMPLETED','CANCELLED'];
    const { order_status } = req.body || {};
    if (!allowed.includes(order_status)) return res.status(400).json({ message: 'Invalid order status.' });
    const [result] = await pool.execute('UPDATE orders SET order_status=? WHERE order_id=?', [order_status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Order not found.' });
    res.json({ message: 'Order status updated.' });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? 'Server error. Check the backend terminal and database connection.' : err.message });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Spice Garden API running at http://localhost:${port}`));
