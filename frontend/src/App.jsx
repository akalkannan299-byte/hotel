import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import {
  ArrowRight, BadgeCheck, ChefHat, Clock3, Coffee, CreditCard, Leaf, MapPin,
  Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, Utensils, X, Phone, Instagram, Facebook
} from 'lucide-react';

const CATEGORIES = ['All', 'Morning', 'Lunch', 'Juices', 'Dinner', 'Snacks', 'Desserts'];
const CATEGORY_LABELS = { All: 'Everything', Morning: 'Morning / Tiffin', Lunch: 'Lunch', Juices: 'Juices & Beverages', Dinner: 'Dinner', Snacks: 'Snacks', Desserts: 'Desserts & Sweets' };
const formatMoney = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const fallbackImages = {
  Morning: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80',
  Lunch: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80',
  Juices: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=80',
  Dinner: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80',
  Snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
  Desserts: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80'
};

function App() {
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [activePage, setActivePage] = useState('Home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ customer_name: '', phone: '', email: '', order_type: 'TAKEAWAY', table_number: '', special_instructions: '', payment_method: 'CASH' });
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminForm, setAdminForm] = useState({ username: 'admin', password: '' });
  const [adminError, setAdminError] = useState('');
  const [newItem, setNewItem] = useState({ category_name: 'Morning', item_name: '', description: '', price: '', image_url: '' });

  const loadMenu = async () => {
    setLoading(true); setError('');
    try {
      const data = await api('/menu');
      setMenu(data.items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadMenu(); }, []);

  const shownItems = useMemo(() => menu.filter(item =>
    (category === 'All' || item.category_name === category) &&
    `${item.item_name} ${item.description || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [menu, category, search]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = item => {
    if (!item.is_available) return;
    setCart(prev => ({ ...prev, [item.item_id]: prev[item.item_id] ? { ...prev[item.item_id], quantity: prev[item.item_id].quantity + 1 } : { ...item, quantity: 1 } }));
    setNotice(`${item.item_name} added to your cart`);
    window.setTimeout(() => setNotice(''), 2200);
  };
  const changeQty = (id, delta) => setCart(prev => {
    const current = prev[id]; if (!current) return prev;
    const nextQty = current.quantity + delta;
    if (nextQty <= 0) { const next = { ...prev }; delete next[id]; return next; }
    return { ...prev, [id]: { ...current, quantity: Math.min(99, nextQty) } };
  });
  const removeItem = id => setCart(prev => { const next = { ...prev }; delete next[id]; return next; });
  const go = page => { setActivePage(page); setCartOpen(false); setCheckoutOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const placeOrder = async event => {
    event.preventDefault();
    if (!cartItems.length) return setNotice('Add at least one item before checkout.');
    if (customer.order_type === 'DINE_IN' && !customer.table_number.trim()) return setNotice('Enter your table number.');
    setPlacing(true); setNotice('');
    try {
      const result = await api('/orders', { method: 'POST', body: JSON.stringify({
        ...customer, items: cartItems.map(item => ({ item_id: item.item_id, quantity: item.quantity }))
      }) });
      setLastOrder(result); setCart({}); setCheckoutOpen(false); setCartOpen(false);
      setNotice(`Order #${result.order_id} placed successfully!`);
      go('My Orders');
    } catch (e) { setNotice(e.message); }
    finally { setPlacing(false); }
  };

  const lookupOrders = async event => {
    event?.preventDefault(); setOrdersError(''); setOrders([]);
    if (!lookupPhone.trim()) return setOrdersError('Enter the mobile number used for the order.');
    try { const data = await api(`/orders/lookup/${encodeURIComponent(lookupPhone.trim())}`); setOrders(data.orders || []); }
    catch (e) { setOrdersError(e.message); }
  };

  const adminLogin = async event => {
    event.preventDefault(); setAdminError('');
    try {
      const data = await api('/admin/login', { method: 'POST', body: JSON.stringify(adminForm) });
      setAdminToken(data.token);
    } catch (e) { setAdminError(e.message); }
  };
  const addMenuItem = async event => {
    event.preventDefault(); setAdminError('');
    try {
      await api('/menu', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ ...newItem, price: Number(newItem.price) }) });
      setNewItem({ category_name: 'Morning', item_name: '', description: '', price: '', image_url: '' });
      await loadMenu(); setNotice('New menu item added.');
    } catch (e) { setAdminError(e.message); }
  };

  return <div className="app-shell">
    <div className="announcement"><span><Clock3 size={14}/> Open daily · 7:00 AM – 10:30 PM</span><span>Freshly prepared. Always welcoming.</span></div>
    <header className="navbar">
      <button className="brand" onClick={() => go('Home')} aria-label="Spice Garden home">
        <span className="brand-mark"><ChefHat size={25}/></span><span><strong>SPICE GARDEN</strong><small>HOTEL & RESTAURANT</small></span>
      </button>
      <nav className="nav-links">
        {['Home', 'Menu', 'My Orders', 'Contact'].map(link => <button key={link} className={activePage === link ? 'nav-link active' : 'nav-link'} onClick={() => go(link)}>{link}</button>)}
        <button className="nav-link admin-link" onClick={() => go('Admin')}>Admin</button>
      </nav>
      <button className="cart-nav" onClick={() => setCartOpen(true)}><ShoppingCart size={18}/><span>Cart</span><b>{cartCount}</b></button>
    </header>

    {notice && <div className="toast" role="status"><BadgeCheck size={18}/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}

    {activePage === 'Home' && <main>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line"></span> GOOD FOOD, GOOD MOOD</div>
          <h1>A little taste of<br/><em>something special.</em></h1>
          <p>From comforting morning tiffin to flavour-packed biryani and sweet little endings — find your favourites, freshly made at Spice Garden.</p>
          <div className="hero-actions"><button className="btn btn-primary" onClick={() => go('Menu')}>Explore our menu <ArrowRight size={17}/></button><button className="btn btn-outline" onClick={() => { go('Menu'); setCategory('All'); }}>Order online</button></div>
          <div className="hero-trust"><span><Leaf size={17}/> Fresh ingredients</span><span><Utensils size={17}/> Made with care</span></div>
        </div>
        <div className="hero-image-wrap">
          <img className="hero-image" src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=85" alt="Traditional Indian meal served on a plate"/>
          <div className="floating-note"><span className="note-star">✦</span><span><strong>Made fresh</strong><small>Every single day</small></span></div>
          <div className="hero-image-caption">A table full of comfort <span>✳</span></div>
        </div>
        <div className="hero-ornament ornament-one">✳</div><div className="hero-ornament ornament-two">✦</div>
      </section>
      <section className="welcome-strip">
        <div><span className="strip-icon"><Coffee size={21}/></span><span><strong>South Indian favourites</strong><small>Comfort in every bite</small></span></div>
        <div><span className="strip-icon"><Clock3 size={21}/></span><span><strong>Quick & easy ordering</strong><small>Your meal, your way</small></span></div>
        <div><span className="strip-icon"><ShoppingBag size={21}/></span><span><strong>Easy checkout</strong><small>Simple and convenient</small></span></div>
      </section>
      <section className="section featured-section">
        <div className="section-heading"><div><div className="eyebrow">A FEW HOUSE FAVOURITES</div><h2>Made to make you smile.</h2></div><button className="text-link" onClick={() => go('Menu')}>View full menu <ArrowRight size={16}/></button></div>
        {loading ? <div className="loading">Preparing the menu…</div> : error ? <div className="error-panel">{error}<button className="btn btn-outline" onClick={loadMenu}>Try again</button></div> :
          <div className="food-grid">{menu.filter(i => ['Masala Dosa','Chicken Biryani','Orange Juice','Gulab Jamun'].includes(i.item_name)).map(item => <FoodCard key={item.item_id} item={item} onAdd={addItem}/>)}</div>}
      </section>
      <section className="quote-band"><span>“</span><p>Good food is the ingredient that brings people together.</p><small>— THE SPICE GARDEN WAY —</small></section>
      <section className="category-promo section"><div><div className="eyebrow">WHATEVER YOU'RE CRAVING</div><h2>There's something<br/><em>for every moment.</em></h2><p>Start your day with tiffin, settle in for lunch, or finish with a sweet treat.</p><button className="btn btn-primary" onClick={() => go('Menu')}>Find your favourite <ArrowRight size={17}/></button></div><div className="category-pills">{CATEGORIES.slice(1).map((cat,i) => <button key={cat} onClick={() => {setCategory(cat);go('Menu');}}><span>{['☀','🍚','🍊','🌙','🥟','🍰'][i]}</span>{CATEGORY_LABELS[cat]}<ArrowRight size={16}/></button>)}</div></section>
    </main>}

    {activePage === 'Menu' && <main className="page-main">
      <div className="page-title"><div className="eyebrow">MADE FRESH FOR YOU</div><h1>Our <em>menu.</em></h1><p>Find a new favourite or order your all-time classic.</p></div>
      <div className="menu-toolbar"><div className="category-tabs">{CATEGORIES.map(cat => <button key={cat} className={category === cat ? 'category-tab selected' : 'category-tab'} onClick={() => setCategory(cat)}>{CATEGORY_LABELS[cat]}</button>)}</div><label className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes…"/>{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15}/></button>}</label></div>
      {loading ? <div className="loading">Loading delicious things…</div> : error ? <div className="error-panel">{error}<button className="btn btn-outline" onClick={loadMenu}>Try again</button></div> : shownItems.length ? <div className="food-grid menu-grid">{shownItems.map(item => <FoodCard key={item.item_id} item={item} onAdd={addItem}/>)}</div> : <div className="empty-state"><span>☕</span><h3>No dishes found</h3><p>Try a different search or category.</p><button className="btn btn-outline" onClick={() => {setSearch('');setCategory('All');}}>Clear filters</button></div>}
    </main>}

    {activePage === 'My Orders' && <main className="page-main narrow-page">
      <div className="page-title"><div className="eyebrow">YOUR TABLE, YOUR HISTORY</div><h1>My <em>orders.</em></h1><p>Enter the mobile number you used at checkout to find your recent orders.</p></div>
      {lastOrder && <div className="success-card"><BadgeCheck size={28}/><div><strong>Order #{lastOrder.order_id} received!</strong><p>Total {formatMoney(lastOrder.total_amount)} · Status: {lastOrder.order_status}</p><small>Payment status: {lastOrder.payment_status}</small></div></div>}
      <form className="lookup-form" onSubmit={lookupOrders}><label>Mobile number<input value={lookupPhone} onChange={e => setLookupPhone(e.target.value)} placeholder="Enter your mobile number" required/></label><button className="btn btn-primary" type="submit">Find orders <ArrowRight size={16}/></button></form>
      {ordersError && <p className="form-error">{ordersError}</p>}
      {orders.length > 0 && <div className="orders-list">{orders.map(order => <article className="order-row" key={order.order_id}><div className="order-number"><span>ORDER</span><strong>#{order.order_id}</strong><small>{new Date(order.created_at).toLocaleString('en-IN')}</small></div><div><span className={`status status-${order.order_status.toLowerCase()}`}>{order.order_status.replace('_',' ')}</span><small>{order.payment_method.replace('_',' ')} · {order.payment_status}</small></div><strong className="order-price">{formatMoney(order.total_amount)}</strong></article>)}</div>}
      {!orders.length && !ordersError && !lastOrder && <div className="empty-state"><span>🧾</span><h3>Your next great meal starts here.</h3><p>Place an order, then look it up here whenever you need.</p><button className="btn btn-primary" onClick={() => go('Menu')}>Browse menu</button></div>}
    </main>}

    {activePage === 'Contact' && <main className="page-main"><div className="page-title"><div className="eyebrow">WE'D LOVE TO SEE YOU</div><h1>Come say <em>hello.</em></h1><p>Good food, friendly faces, and a seat waiting for you.</p></div><div className="contact-grid"><div className="contact-card"><MapPin/><h3>Visit us</h3><p>Spice Garden Hotel & Restaurant<br/>Your neighbourhood dining place<br/>Chennai, Tamil Nadu, India</p></div><div className="contact-card"><Phone/><h3>Call us</h3><p>+91 98765 43210<br/>hello@spicegarden.example</p></div><div className="contact-card"><Clock3/><h3>Opening hours</h3><p>Monday – Sunday<br/>7:00 AM – 10:30 PM</p></div></div><div className="contact-note"><ChefHat size={32}/><div><h2>Planning a meal?</h2><p>Browse the menu and build your order in just a few clicks.</p></div><button className="btn btn-primary" onClick={() => go('Menu')}>Explore menu <ArrowRight size={16}/></button></div></main>}

    {activePage === 'Admin' && <main className="page-main narrow-page"><div className="page-title"><div className="eyebrow">STAFF AREA</div><h1>Admin <em>desk.</em></h1><p>Manage the sample menu. Configure credentials in the backend .env file.</p></div>
      {!adminToken ? <form className="admin-login form-card" onSubmit={adminLogin}><h2>Sign in</h2><label>Username<input value={adminForm.username} onChange={e => setAdminForm({...adminForm,username:e.target.value})} required/></label><label>Password<input type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm,password:e.target.value})} required/></label>{adminError && <p className="form-error">{adminError}</p>}<button className="btn btn-primary" type="submit">Sign in <ArrowRight size={16}/></button><small className="muted">Demo default: username admin; password is set in backend/.env (ChangeMe123! initially).</small></form> :
      <div className="admin-panel form-card"><div className="admin-panel-heading"><h2>Add a menu item</h2><button className="text-link" onClick={() => setAdminToken('')}>Sign out</button></div><form onSubmit={addMenuItem} className="admin-item-form"><label>Category<select value={newItem.category_name} onChange={e => setNewItem({...newItem,category_name:e.target.value})}>{CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>Item name<input value={newItem.item_name} onChange={e => setNewItem({...newItem,item_name:e.target.value})} required/></label><label>Description<input value={newItem.description} onChange={e => setNewItem({...newItem,description:e.target.value})}/></label><label>Price (₹)<input type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem,price:e.target.value})} required/></label><label>Image URL<input value={newItem.image_url} onChange={e => setNewItem({...newItem,image_url:e.target.value})} placeholder="https://…"/></label>{adminError && <p className="form-error">{adminError}</p>}<button className="btn btn-primary" type="submit">Add item <Plus size={16}/></button></form><div className="admin-list"><h3>Current menu ({menu.length})</h3>{menu.map(item => <div className="admin-menu-row" key={item.item_id}><span>{item.item_name}<small>{item.category_name}</small></span><strong>{formatMoney(item.price)}</strong><span className={item.is_available ? 'available' : 'unavailable'}>{item.is_available ? 'Available' : 'Unavailable'}</span><button className="icon-button" title="Mark unavailable" onClick={async () => {try {await api(`/menu/${item.item_id}`,{method:'DELETE',headers:{Authorization:`Bearer ${adminToken}`}});await loadMenu();}catch(e){setAdminError(e.message);}}}><Trash2 size={16}/></button></div>)}</div></div>}
    </main>}

    <Footer go={go}/>
    {cartOpen && <><button className="drawer-backdrop" aria-label="Close cart" onClick={() => setCartOpen(false)}></button><aside className="cart-drawer"><div className="drawer-heading"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your cart <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close"><X/></button></div>
      {cartItems.length === 0 ? <div className="empty-cart"><ShoppingBag size={42}/><h3>Your cart is taking a little break.</h3><p>Add something delicious from our menu.</p><button className="btn btn-primary" onClick={() => {setCartOpen(false);go('Menu');}}>Browse menu</button></div> : <>
        <div className="cart-items">{cartItems.map(item => <div className="cart-item" key={item.item_id}><img src={item.image_url || fallbackImages[item.category_name] || fallbackImages.Morning} alt="" onError={e => {e.currentTarget.src=fallbackImages[item.category_name]||fallbackImages.Morning;}}/><div className="cart-item-info"><strong>{item.item_name}</strong><small>{formatMoney(item.price)} each</small><div className="quantity-control"><button onClick={() => changeQty(item.item_id,-1)} aria-label="Decrease quantity"><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => changeQty(item.item_id,1)} aria-label="Increase quantity"><Plus size={13}/></button></div></div><div className="cart-item-end"><strong>{formatMoney(item.price*item.quantity)}</strong><button className="remove-link" onClick={() => removeItem(item.item_id)}>Remove</button></div></div>)}</div>
        <div className="cart-summary"><div><span>Subtotal</span><strong>{formatMoney(cartTotal)}</strong></div><div><span>Taxes</span><strong>₹0.00</strong></div><div className="summary-total"><span>Total</span><strong>{formatMoney(cartTotal)}</strong></div><small>Final total is recalculated securely by the server.</small><button className="btn btn-primary full-btn" onClick={() => {setCartOpen(false);setCheckoutOpen(true);}}>Continue to checkout <ArrowRight size={17}/></button></div>
      </>}</aside></>}

    {checkoutOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => {if(e.target===e.currentTarget)setCheckoutOpen(false);}}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="modal-heading"><div><span className="eyebrow">ALMOST THERE</span><h2 id="checkout-title">Checkout</h2></div><button className="icon-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X/></button></div>
      <form className="checkout-form" onSubmit={placeOrder}><div className="checkout-columns"><div className="checkout-fields"><label>Customer name<input value={customer.customer_name} onChange={e => setCustomer({...customer,customer_name:e.target.value})} required minLength="2" placeholder="Your full name"/></label><label>Mobile number<input value={customer.phone} onChange={e => setCustomer({...customer,phone:e.target.value})} required pattern="\\+?[0-9\\s-]{7,18}" placeholder="10-digit mobile number"/></label><label>Email (optional)<input type="email" value={customer.email} onChange={e => setCustomer({...customer,email:e.target.value})} placeholder="you@example.com"/></label><label>Order type<select value={customer.order_type} onChange={e => setCustomer({...customer,order_type:e.target.value})}><option value="TAKEAWAY">Takeaway</option><option value="DINE_IN">Dine in</option></select></label>{customer.order_type==='DINE_IN' && <label>Table number<input value={customer.table_number} onChange={e => setCustomer({...customer,table_number:e.target.value})} required placeholder="e.g. 08"/></label>}<label>Special instructions (optional)<textarea rows="2" maxLength="500" value={customer.special_instructions} onChange={e => setCustomer({...customer,special_instructions:e.target.value})} placeholder="Less spicy, no onion…"/></label></div><div className="payment-panel"><h3><CreditCard size={18}/> Payment method</h3>{[['CASH','Cash at counter'],['UPI','UPI (demo)'],['CARD','Debit / credit card (demo)'],['NET_BANKING','Net banking (demo)'],['WALLET','Wallet (demo)']].map(([value,label])=><label className="payment-option" key={value}><input type="radio" name="payment" value={value} checked={customer.payment_method===value} onChange={e => setCustomer({...customer,payment_method:e.target.value})}/><span>{label}</span></label>)}<div className="checkout-total"><span>Total payable</span><strong>{formatMoney(cartTotal)}</strong></div><small>Demo only: online methods are not charged.</small></div></div>
        <div className="checkout-footer"><span><ShoppingBag size={17}/>{cartCount} item(s) · {formatMoney(cartTotal)}</span><button className="btn btn-primary" disabled={placing || !cartItems.length} type="submit">{placing ? 'Placing order…' : 'Place order'} <ArrowRight size={16}/></button></div>
      </form></section></div>}
  </div>;
}

function FoodCard({ item, onAdd }) {
  const [imgFailed, setImgFailed] = useState(false);
  return <article className="food-card"><div className="food-image-wrap"><img src={imgFailed ? fallbackImages[item.category_name] || fallbackImages.Morning : item.image_url || fallbackImages[item.category_name] || fallbackImages.Morning} alt={item.item_name} loading="lazy" onError={() => setImgFailed(true)}/><span className="food-category">{item.category_name}</span>{!item.is_available && <span className="sold-out">Currently unavailable</span>}</div><div className="food-card-content"><div className="food-title-row"><h3>{item.item_name}</h3><strong>{formatMoney(item.price)}</strong></div><p>{item.description || 'Freshly prepared with care.'}</p><button className="add-button" disabled={!item.is_available} onClick={() => onAdd(item)}><Plus size={16}/>{item.is_available ? 'Add to cart' : 'Unavailable'}</button></div></article>;
}

function Footer({ go }) {
  return <footer className="footer"><div className="footer-main"><div className="footer-brand"><div className="footer-logo"><ChefHat size={23}/><strong>SPICE GARDEN</strong></div><p>Delicious food, prepared fresh and served with care. A little taste of home, wherever you are.</p><div className="socials"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a><a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17}/></a></div></div><div className="footer-links"><h4>EXPLORE</h4>{['Home','Menu','My Orders','Contact'].map(link => <button key={link} onClick={() => go(link)}>{link}</button>)}</div><div className="footer-contact"><h4>COME ON IN</h4><p><MapPin size={16}/> Chennai, Tamil Nadu, India</p><p><Phone size={16}/> +91 98765 43210</p><p><Clock3 size={16}/> Daily · 7 AM – 10:30 PM</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Spice Garden. All rights reserved.</span><span>Made with care, served with flavour. <span className="footer-heart">♥</span></span></div></footer>;
}

export default App;
