import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Eye, EyeOff, Heart, Menu,
  Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Star, Trash2, UserRound, X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { CartProvider } from './context/CartContext';
import { useCart } from './context/cartStore';
import { products, type Product } from './data/products';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import './App.css';

const money = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(amount);

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Unable to restore the Supabase session.', error);
      if (active) setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Announcement />
          <Navbar user={user} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/sale" element={<ProductsPage saleOnly />} />
              <Route path="/men" element={<ProductsPage category="Men" />} />
              <Route path="/women" element={<ProductsPage category="Women" />} />
              <Route path="/accessories" element={<ProductsPage category="Accessories" />} />
              <Route path="/shoes" element={<ProductsPage category="Shoes" />} />
              <Route path="/bags" element={<ProductsPage category="Bags" />} />
              <Route path="/new-arrivals" element={<ProductsPage newArrivals />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/account" element={<AccountPage user={user} onLogout={logout} />} />
              <Route path="/checkout" element={<CheckoutPage user={user} />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<EmptyState title="This page wandered off." detail="Let's get you back to something lovely." action="Back to home" to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

function Announcement() {
  return <div className="announcement">A little something extra: complimentary shipping on orders over ₹5,000 <span>✦</span> 30-day easy returns</div>;
}

function Navbar({ user }: { user: User | null }) {
  const { items, wishlist } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const links = [
    { to: '/', label: 'Home' },
    { to: '/men', label: 'Men' },
    { to: '/women', label: 'Women' },
    { to: '/accessories', label: 'Accessories' },
    { to: '/new-arrivals', label: 'New arrivals' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="site-header">
      <div className="nav-row page-width">
        <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <Link to="/" className="brand" aria-label="Voguée home">VOGU<span>É</span>E<small>FASHION STORE</small></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'}>{link.label}</NavLink>)}
        </nav>
        <div className="nav-actions">
          <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={19} /></button>
          <Link className="icon-button account-action" to={user ? '/account' : '/login'} aria-label="Account"><UserRound size={19} /></Link>
          <Link className="icon-button icon-count" to="/wishlist" aria-label={`Wishlist, ${wishlist.length} items`}><Heart size={19} />{wishlist.length > 0 && <span>{wishlist.length}</span>}</Link>
          <Link className="icon-button icon-count" to="/cart" aria-label={`Shopping bag, ${itemCount} items`}><ShoppingBag size={19} />{itemCount > 0 && <span>{itemCount}</span>}</Link>
        </div>
      </div>
      {searchOpen && <form className="search-bar page-width" onSubmit={(event) => {
        event.preventDefault();
        navigate(`/products?q=${encodeURIComponent(search)}`);
        setSearchOpen(false);
      }}>
        <Search size={18} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection..." aria-label="Search products" />
        <button className="text-button" type="submit">Search <ArrowRight size={16} /></button>
        <button className="icon-button" type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button>
      </form>}
      {mobileOpen && <nav className="mobile-nav">
        {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setMobileOpen(false)}>{link.label}<ArrowRight size={16} /></NavLink>)}
      </nav>}
    </header>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim()) setSubscribed(true);
  };
  return <footer className="site-footer">
    <div className="footer-top page-width">
      <div className="footer-brand">
        <Link to="/" className="brand brand-light">VOGU<span>É</span>E<small>FASHION STORE</small></Link>
        <p>Thoughtful pieces for wherever life takes you.<br />Wear Your Confidence.</p>
        <div className="social-links"><a href="https://instagram.com" aria-label="Instagram">ig</a><a href="https://facebook.com" aria-label="Facebook">f</a></div>
      </div>
      <div className="footer-column"><h3>Explore</h3><Link to="/men">Men</Link><Link to="/women">Women</Link><Link to="/accessories">Accessories</Link><Link to="/new-arrivals">New arrivals</Link><Link to="/sale">The sale edit</Link></div>
      <div className="footer-column"><h3>Here to help</h3><Link to="/about">About us</Link><Link to="/contact">Contact us</Link><a href="/contact#faqs">FAQs</a><a href="/contact#shipping">Shipping</a><a href="/contact#returns">Returns</a><a href="/contact#privacy">Privacy policy</a></div>
      <div className="footer-newsletter"><h3>A note from us</h3><p>New collections, good things, and 10% off your first order.</p>
        {subscribed ? <p className="subscribe-success"><Check size={16} /> Thanks — this demo doesn't send email.</p> : <form onSubmit={subscribe} className="newsletter-form"><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input id="newsletter-email" type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} required /><button aria-label="Subscribe"><ArrowRight size={18} /></button></form>}
      </div>
    </div>
    <div className="footer-bottom page-width"><span>© VOGUÉE. Made for your every day.</span><span>Designed with intention <span className="gold-dot">✦</span></span></div>
  </footer>;
}

function Home() {
  const featured = products.filter((product) => product.isBestSeller).slice(0, 4);
  const arrivals = products.filter((product) => product.isNew).slice(0, 4);
  const categories = [
    { label: 'Women', to: '/women', image: 'photo-1483985988355-763728e1935b', note: 'The art of getting dressed' },
    { label: 'Men', to: '/men', image: 'photo-1515886657613-9f3515b0c78f', note: 'A better kind of everyday' },
    { label: 'Shoes', to: '/shoes', image: 'photo-1543163521-1bf539c55dd2', note: 'Find your footing' },
    { label: 'Bags', to: '/bags', image: 'photo-1584917865442-de89df76afd3', note: 'Carry a little more' },
    { label: 'Accessories', to: '/accessories', image: 'photo-1611652022419-a9419f74343d', note: 'The finishing touch' },
  ];

  return <>
    <section className="hero">
      <img className="hero-image" src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=90" alt="Model in a modern neutral-toned fashion look" />
      <div className="hero-shade" />
      <div className="hero-content page-width"><span className="eyebrow eyebrow-light">THE AUTUMN / WINTER EDIT</span><h1>YOUR STYLE.<br /><em>YOUR STORY.</em></h1><p>Considered pieces. Unmistakably you.</p><div className="hero-buttons"><Link to="/products" className="button button-light">Shop now <ArrowRight size={17} /></Link><Link to="/new-arrivals" className="button button-outline-light">Explore collection <ArrowUpRight size={16} /></Link></div></div>
      <div className="hero-caption"><span>01 — NEW SEASON, NEW PERSPECTIVE</span><span>SCROLL TO DISCOVER <ArrowDown size={14} /></span></div>
    </section>
    <section className="intro-strip page-width"><span className="eyebrow">A LITTLE LESS ORDINARY</span><p>Good clothes should feel like <em>you</em> — just a little more.</p><Link to="/products" className="underlined-link">Discover the collection <ArrowRight size={15} /></Link></section>
    <section className="section-block categories-section page-width">
      <SectionHeading eyebrow="FIND YOUR FEEL" title="Made for your kind of day" link="/products" linkText="Shop all" />
      <div className="category-grid">{categories.map((category, index) => <Link className={`category-card category-card-${index + 1}`} to={category.to} key={category.label}><img src={`https://images.unsplash.com/${category.image}?auto=format&fit=crop&w=950&q=85`} alt={`${category.label} collection`} loading="lazy" /><span className="category-copy"><small>{category.note}</small><strong>{category.label}<ArrowUpRight size={18} /></strong></span></Link>)}</div>
    </section>
    <ProductShelf eyebrow="THE PIECES YOU LOVE" title="A little bit iconic" list={featured} link="/products" linkText="Shop bestsellers" />
    <section className="season-banner"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=85" alt="Seasonal fashion collection" loading="lazy" /><div className="season-shade" /><div className="season-copy"><span className="eyebrow eyebrow-light">THE END-OF-SEASON EDIT</span><h2>Good style.<br /><em>Better prices.</em></h2><p>Up to 25% off selected favourites.<br />A few pieces you’ll love, for a little less.</p><Link to="/sale" className="button button-light">Shop the sale <ArrowRight size={17} /></Link></div></section>
    <ProductShelf eyebrow="JUST LANDED" title="The new, the now" list={arrivals} link="/new-arrivals" linkText="See all new arrivals" />
    <section className="review-section"><div className="review-inner"><span className="eyebrow">KIND WORDS, WORN WELL</span><div className="stars" aria-label="5 out of 5 stars"><Star /><Star /><Star /><Star /><Star /></div><blockquote>“Everything feels so considered — the fabric, the fit, even the packaging. I finally found pieces that feel like me.”</blockquote><p className="review-author">PRIYA S. <span>·</span> VERIFIED CUSTOMER</p><div className="review-dots"><span className="active" /><span /><span /></div></div></section>
    <section className="newsletter-panel"><span className="eyebrow">GOOD THINGS, OCCASIONALLY</span><h2>A little more <em>you.</em></h2><p>New collections, styling notes, and 10% off your first order.</p><NewsletterInline /></section>
  </>;
}

function SectionHeading({ eyebrow, title, link, linkText }: { eyebrow: string; title: string; link: string; linkText: string }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link className="underlined-link" to={link}>{linkText} <ArrowRight size={15} /></Link></div>;
}

function ProductShelf({ eyebrow, title, list, link, linkText }: { eyebrow: string; title: string; list: Product[]; link: string; linkText: string }) {
  return <section className="section-block page-width"><SectionHeading eyebrow={eyebrow} title={title} link={link} linkText={linkText} /><div className="product-grid product-grid-home">{list.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>;
}

function ProductCard({ product }: { product: Product }) {
  const { wishlist, toggleWishlist, addItem } = useCart();
  const saved = wishlist.includes(product.id);
  return <article className="product-card">
    <div className="product-image-wrap"><Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}><img src={product.image} alt={product.name} loading="lazy" /></Link>
      <div className="product-badges">{product.isNew && <span className="badge badge-new">Just in</span>}{product.originalPrice && <span className="badge badge-sale">Sale</span>}</div>
      <button className={`wishlist-toggle ${saved ? 'is-saved' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}><Heart size={18} fill={saved ? 'currentColor' : 'none'} /></button>
      <button className="quick-add" onClick={() => addItem({ productId: product.id, name: product.name, price: product.price, image: product.image })}>Quick add <Plus size={15} /></button>
    </div>
    <div className="product-meta"><div><span className="product-category">{product.category}</span><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link></div><div className="product-price">{money(product.price)}{product.originalPrice && <del>{money(product.originalPrice)}</del>}</div></div>
    <div className="color-dots" aria-label={`Available colours: ${product.colors.join(', ')}`}>{product.colors.slice(0, 4).map((color, index) => <span key={color} title={color} className={`color-dot color-${index}`} />)}</div>
  </article>;
}

function ProductsPage({ category, newArrivals = false, saleOnly = false }: { category?: Product['category']; newArrivals?: boolean; saleOnly?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const selectedCategory = category ?? 'All';

  const filtered = useMemo(() => {
    let result = products.filter((product) => (!newArrivals || product.isNew)
      && (!saleOnly || Boolean(product.originalPrice))
      && (selectedCategory === 'All' || product.category === selectedCategory)
      && product.price <= maxPrice
      && `${product.name} ${product.category}`.toLowerCase().includes(search.trim().toLowerCase()));
    if (sort === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'newest') result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }, [maxPrice, newArrivals, saleOnly, search, selectedCategory, sort]);

  const title = saleOnly ? 'The sale edit' : newArrivals ? 'Just landed' : category ? `${category}, considered` : 'The collection';
  return <div className="catalog-page page-width">
    <div className="catalog-heading"><span className="eyebrow">THE VOGUÉE EDIT</span><h1>{title}</h1><p>Pieces to reach for, again and again.</p></div>
    <div className="catalog-toolbar"><span>{filtered.length} thoughtfully chosen pieces</span><div className="catalog-controls"><button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> Filters <ChevronDown size={14} /></button><label className="sort-control">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div></div>
    <div className="catalog-layout">
      <aside className={`filter-panel ${filtersOpen ? 'filters-open' : ''}`}><div className="filter-group"><h3>Category</h3>{['All', 'Women', 'Men', 'Shoes', 'Bags', 'Accessories'].map((value) => <button key={value} className={selectedCategory === value ? 'filter-option selected' : 'filter-option'} onClick={() => navigate(value === 'All' ? '/products' : `/${value.toLowerCase()}`)}>{value}<span>{value === 'All' ? products.length : products.filter((product) => product.category === value).length}</span></button>)}</div><div className="filter-group"><h3>Price range</h3><div className="price-label"><span>₹0</span><span>{money(maxPrice)}</span></div><input type="range" min="1000" max="10000" step="250" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum price" /></div><div className="filter-group"><h3>Search</h3><label className="filter-search"><Search size={15} /><input value={search} onChange={(event) => { const query = event.target.value; setSearchParams(query ? { q: query } : {}); }} placeholder="Find your piece" /></label></div><button className="clear-filters" onClick={() => { setMaxPrice(10000); navigate('/products'); }}>Clear all filters</button></aside>
      {filtered.length ? <div className="product-grid catalog-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="no-results"><Search size={26} /><h2>No pieces found</h2><p>Try a different search or clear your filters to see the full collection.</p><button className="button button-dark" onClick={() => { setMaxPrice(10000); navigate('/products'); }}>Clear filters</button></div>}
    </div>
  </div>;
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === id);
  const { wishlist, toggleWishlist, addItem } = useCart();
  const [size, setSize] = useState('');
  const [color, setColor] = useState(product?.colors[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (!product) return <EmptyState title="We couldn't find that piece." detail="It may have moved on to a new home." action="Explore the collection" to="/products" />;
  const saved = wishlist.includes(product.id);
  const addToBag = () => {
    if (product.sizes.length && !size) return;
    for (let count = 0; count < quantity; count += 1) addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, size: size || undefined, color });
    setAdded(true);
  };
  return <div className="detail-page page-width"><button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back to the edit</button><div className="detail-layout"><div className="detail-image"><img src={product.image} alt={product.name} /></div><div className="detail-copy"><span className="eyebrow">{product.category} · VOGUÉE STUDIO</span><h1>{product.name}</h1><div className="detail-price">{money(product.price)}{product.originalPrice && <del>{money(product.originalPrice)}</del>}</div><p className="detail-description">{product.description}</p><div className="detail-option"><div className="option-heading"><strong>Colour</strong><span>{color}</span></div><div className="color-picker">{product.colors.map((item, index) => <button key={item} title={item} onClick={() => setColor(item)} className={`color-choice color-${index} ${color === item ? 'chosen' : ''}`} aria-label={`Select ${item}`} />)}</div></div>{product.sizes.length > 0 && <div className="detail-option"><div className="option-heading"><strong>Size</strong><button className="text-button">Size guide</button></div><div className="size-picker">{product.sizes.map((item) => <button key={item} className={size === item ? 'chosen' : ''} onClick={() => setSize(item)}>{item}</button>)}</div>{!size && <small className="helper-text">Please select a size.</small>}</div>}<div className="detail-actions"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div><button className="button button-dark add-to-bag" onClick={addToBag}>{added ? <><Check size={17} /> Added to bag</> : <>Add to bag <ShoppingBag size={17} /></>}</button></div><button className="save-product" onClick={() => toggleWishlist(product.id)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved to your wishlist' : 'Add to wishlist'}</button><div className="detail-perks"><p><Check size={15} /> Free shipping over ₹5,000</p><p><Check size={15} /> Easy returns within 30 days</p></div></div></div><section className="section-block"><SectionHeading eyebrow="YOU MIGHT ALSO LOVE" title="A few more favourites" link="/products" linkText="View all" /><div className="product-grid product-grid-home">{products.filter((item) => item.id !== product.id).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}</div></section></div>;
}

function CartPage() {
  const { items, updateQuantity, removeItem, total, couponApplied, setCouponApplied } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const discount = couponApplied ? Math.round(total * 0.1) : 0;
  const shipping = total === 0 || total >= 5000 ? 0 : 199;
  const grandTotal = total - discount + shipping;
  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'STYLE10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponApplied(false);
      setCouponError('That code didn’t work. Try STYLE10.');
    }
  };
  return <div className="page-width cart-page"><div className="page-title"><span className="eyebrow">YOUR EDIT, YOUR WAY</span><h1>Your bag <span>({items.reduce((sum, item) => sum + item.quantity, 0)})</span></h1></div>
    {!items.length ? <EmptyState title="Your bag is taking a breather." detail="A few good pieces can change the whole feel of a day." action="Continue shopping" to="/products" /> : <div className="cart-layout"><div className="cart-items">{items.map((item) => <article className="cart-item" key={item.id}><Link to={`/product/${item.productId}`}><img src={item.image} alt={item.name} /></Link><div className="cart-item-info"><span className="product-category">{products.find((product) => product.id === item.productId)?.category}</span><Link to={`/product/${item.productId}`} className="product-name">{item.name}</Link>{(item.size || item.color) && <small>{[item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ')}</small>}<div className="cart-line-bottom"><div className="quantity-control"><button aria-label={`Decrease ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button></div><button className="remove-link" onClick={() => removeItem(item.id)}><Trash2 size={14} /> Remove</button></div></div><strong className="cart-item-price">{money(item.price * item.quantity)}</strong></article>)}</div>
      <aside className="order-summary"><h2>Order summary</h2><div className="coupon-entry"><label htmlFor="coupon">Have a little code?</label><div><input id="coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Enter code" /><button onClick={applyCoupon}>Apply</button></div>{couponError && <small className="field-error">{couponError}</small>}{couponApplied && <small className="field-success"><Check size={13} /> STYLE10 applied — 10% off</small>}</div><div className="summary-line"><span>Subtotal</span><span>{money(total)}</span></div><div className="summary-line"><span>Shipping</span><span>{shipping === 0 ? 'Complimentary' : money(shipping)}</span></div>{discount > 0 && <div className="summary-line summary-discount"><span>STYLE10 discount</span><span>−{money(discount)}</span></div>}<div className="summary-total"><strong>Total</strong><strong>{money(grandTotal)}</strong></div><Link to="/checkout" className="button button-dark checkout-button">Continue to checkout <ArrowRight size={17} /></Link><p className="secure-note"><Check size={14} /> Secure checkout · Demo order, no payment collected</p><Link className="continue-link" to="/products"><ArrowLeft size={15} /> Keep exploring</Link></aside>
    </div>}
  </div>;
}

function WishlistPage() {
  const { wishlist } = useCart();
  const savedProducts = products.filter((product) => wishlist.includes(product.id));
  return <div className="page-width wishlist-page"><div className="page-title"><span className="eyebrow">THE PIECES YOU'RE THINKING ABOUT</span><h1>Your wishlist <span>({savedProducts.length})</span></h1></div>{savedProducts.length ? <div className="product-grid catalog-grid">{savedProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState title="Nothing saved just yet." detail="When a piece feels like you, tap the little heart and keep it close." action="Find your favourites" to="/products" />}</div>;
}

function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (password.length < 8) {
      setError('Your password needs at least 8 characters.');
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      setMessage('Demo mode — connect Supabase to create an account or sign in. No account has been created.');
      return;
    }
    setBusy(true);
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
    } else if (mode === 'signup' && !result.data.session) {
      setMessage('Check your email to confirm your account before signing in.');
    } else {
      navigate('/account');
    }
  };
  return <div className="auth-page"><div className="auth-card"><span className="eyebrow">{isSupabaseConfigured ? 'YOUR VOGUÉE ACCOUNT' : 'A FRIENDLY DEMO'}</span><h1>{mode === 'login' ? 'Welcome back.' : 'Make it yours.'}</h1><p>{mode === 'login' ? 'Good to have you here again.' : 'A little place for all your favourites.'}</p>{!isSupabaseConfigured && <div className="demo-notice"><span>DEMO MODE</span><p>Authentication is not connected yet. Browsing and shopping demos work without an account; signing in will not create a session.</p></div>}<form onSubmit={submit} className="auth-form">{mode === 'signup' && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><small>At least 8 characters</small></label>{error && <p className="field-error">{error}</p>}{message && <p className="form-message">{message}</p>}<button className="button button-dark auth-submit" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><p className="auth-switch">{mode === 'login' ? 'New around here?' : 'Already have an account?'} <Link to={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Link></p></div></div>;
}

interface SavedOrder {
  id: string;
  created_at: string;
  order_status: string;
  grand_total: number;
  items: Array<{ name: string; quantity: number; size?: string }>;
}

function AccountPage({ user, onLogout }: { user: User | null; onLogout: () => Promise<void> }) {
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !supabase) return undefined;
    let active = true;
    void supabase.from('orders')
      .select('id, created_at, order_status, grand_total, items')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<SavedOrder[]>()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          console.error('Unable to load order history.', queryError);
          setOrdersError('Order history is unavailable. Check that the Supabase orders schema has been applied.');
        } else {
          setOrders(data ?? []);
        }
        setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return <div className="page-width account-page"><div className="page-title"><span className="eyebrow">YOUR VOGUÉE</span><h1>Your account</h1></div><div className="account-demo"><div className="demo-notice"><span>{isSupabaseConfigured ? 'NOT SIGNED IN' : 'DEMO MODE'}</span><p>{isSupabaseConfigured ? 'Sign in to view your account details.' : 'Supabase is not configured, so there is no active account session.'}</p></div><Link className="button button-dark" to="/login">Sign in <ArrowRight size={16} /></Link></div></div>;
  return <div className="page-width account-page"><div className="page-title"><span className="eyebrow">A GOOD PLACE TO BE</span><h1>Hello, {user.user_metadata.full_name || user.email?.split('@')[0]}.</h1><p>{user.email}</p></div>{error && <p className="field-error">{error}</p>}<div className="account-actions"><button className="button button-dark" onClick={() => { void onLogout().then(() => navigate('/')).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to sign out.')); }}>Sign out</button></div><section className="account-orders"><h2>Recent orders</h2>{ordersError ? <p className="field-error">{ordersError}</p> : ordersLoading ? <p className="muted-copy">Loading your order history…</p> : orders.length ? orders.map((order) => <article className="account-order" key={order.id}><div><strong>Order {order.id.slice(0, 8).toUpperCase()}</strong><small>{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</small></div><div><span className="order-status">{order.order_status}</span><strong>{money(order.grand_total)}</strong></div></article>) : <div className="account-empty"><p>No orders yet. Your next favourite is waiting.</p><Link to="/products" className="underlined-link">Explore the collection <ArrowRight size={15} /></Link></div>}</section></div>;
}

function CheckoutPage({ user }: { user: User | null }) {
  const { items, total, clearCart, couponApplied } = useCart();
  const [complete, setComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderSaved, setOrderSaved] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const shipping = total >= 5000 ? 0 : total ? 199 : 0;
  const discount = couponApplied ? Math.round(total * 0.1) : 0;
  const grandTotal = total - discount + shipping;
  const navigate = useNavigate();
  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const formData = new FormData(event.currentTarget);
    if (supabase && user) {
      setBusy(true);
      try {
        const { data, error: insertError } = await supabase.from('orders').insert({
          user_id: user.id,
          customer_name: String(formData.get('name')),
          email: String(formData.get('email')),
          phone: String(formData.get('phone')),
          street_address: String(formData.get('address')),
          city: String(formData.get('city')),
          state: String(formData.get('state')),
          postal_code: String(formData.get('postalCode')),
          items: items.map(({ productId, name, price, quantity, size, color }) => ({
            product_id: productId,
            name,
            unit_price: price,
            quantity,
            size,
            color,
          })),
          subtotal: total,
          discount,
          shipping,
          grand_total: grandTotal,
        }).select('id').single();
        if (insertError) {
          setFormError(insertError.message);
          return;
        }
        setOrderNumber(`VG-${data.id.slice(0, 8).toUpperCase()}`);
        setOrderSaved(true);
      } catch (reason: unknown) {
        setFormError(reason instanceof Error ? reason.message : 'We could not save your order. Please try again.');
        return;
      } finally {
        setBusy(false);
      }
    } else {
      setOrderNumber(`VG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
      setOrderSaved(false);
    }
    setComplete(true);
    clearCart();
  };
  if (complete) return <div className="order-complete page-width"><div className="success-icon"><Check size={30} /></div><span className="eyebrow">THAT'S A WRAP</span><h1>Your order is in the works.</h1><p>Thanks for choosing Voguée. Order <strong>{orderNumber}</strong> {orderSaved ? 'is saved to your account.' : 'was placed in this demo locally.'} No payment was collected.</p><button className="button button-dark" onClick={() => navigate('/products')}>Back to the collection <ArrowRight size={16} /></button></div>;
  return <div className="page-width checkout-page"><div className="page-title"><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1><p>{user && supabase ? 'Demo checkout — your order will be saved to your account; no payment is collected.' : 'Demo checkout — this form does not collect payment or create a server order.'}</p>{isSupabaseConfigured && !user && <p><Link to="/login" className="underlined-link">Sign in</Link> to save this order to your account, or continue in demo mode.</p>}</div>{!items.length ? <EmptyState title="Your bag is empty." detail="Add something lovely before you check out." action="Explore the collection" to="/products" /> : <div className="checkout-layout"><form className="checkout-form" onSubmit={placeOrder}><h2>Delivery details</h2><div className="form-grid"><label className="full-width">Full name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" inputMode="numeric" pattern="[0-9]{8,15}" required /></label><label className="full-width">Address<input name="address" autoComplete="street-address" required /></label><label>City<input name="city" autoComplete="address-level2" required /></label><label>State<input name="state" autoComplete="address-level1" required /></label><label>PIN code<input name="postalCode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" required /></label></div><div className="payment-demo"><span className="eyebrow">PAYMENT</span><p><Check size={16} /> Pay on delivery <small>Demo option · payment is not processed</small></p></div>{formError && <p className="field-error">{formError}</p>}<button className="button button-dark checkout-button" disabled={busy}>{busy ? 'Saving order…' : 'Place demo order'} <ArrowRight size={17} /></button></form><aside className="order-summary"><h2>Your order</h2>{items.map((item) => <div className="checkout-item" key={item.id}><img src={item.image} alt="" /><div><strong>{item.name}</strong><small>{item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity}</small></div><span>{money(item.price * item.quantity)}</span></div>)}<div className="summary-line"><span>Subtotal</span><span>{money(total)}</span></div>{discount > 0 && <div className="summary-line summary-discount"><span>STYLE10 discount</span><span>−{money(discount)}</span></div>}<div className="summary-line"><span>Shipping</span><span>{shipping ? money(shipping) : 'Complimentary'}</span></div><div className="summary-total"><strong>Total</strong><strong>{money(grandTotal)}</strong></div></aside></div>}</div>;
}

function AboutPage() {
  return <div className="about-page">
    <section className="about-hero page-width"><div><span className="eyebrow">OUR POINT OF VIEW</span><h1>Wear your<br /><em>confidence.</em></h1><p>Voguée is for the way you actually live — the big plans, the slow mornings, and every good ordinary in between.</p><Link to="/products" className="button button-dark">Find your feel <ArrowRight size={16} /></Link></div><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85" alt="Friends enjoying a day out in considered everyday style" /></section>
    <section className="about-values page-width"><span className="eyebrow">THOUGHTFUL BY DESIGN</span><h2>Less, but more you.</h2><div className="values-grid"><article><span>01</span><h3>Made to be worn</h3><p>Versatile silhouettes and useful details, designed to find their way into your everyday.</p></article><article><span>02</span><h3>Considered choices</h3><p>We look for pieces that feel good to reach for, season after season.</p></article><article><span>03</span><h3>Always your story</h3><p>Personal style has no rules. We’re here for the confidence that comes from making it yours.</p></article></div></section>
  </div>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };
  return <div className="contact-page page-width"><div className="contact-heading"><span className="eyebrow">WE'RE ALL EARS</span><h1>Let's talk<br /><em>good style.</em></h1><p>Questions, a little feedback, or just want to say hello? We're here for it.</p><a className="underlined-link" href="mailto:hello@voguee.example">hello@voguee.example <ArrowUpRight size={15} /></a></div><div className="contact-form-wrap">{sent ? <div className="contact-sent"><Check size={25} /><h2>Thanks for reaching out.</h2><p>Your note is ready for our team. In this demo, nothing has been sent to a server.</p></div> : <form className="contact-form" onSubmit={submit}><label>Your name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>What’s on your mind?<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} required /></label><button className="button button-dark">Send us a note <ArrowRight size={16} /></button></form>}</div><section className="contact-info" id="faqs"><div><span className="eyebrow">NEED A HAND?</span><h2>Frequently asked</h2></div><details id="shipping"><summary>How long does delivery take?<ChevronDown size={16} /></summary><p>Orders usually arrive in 3–7 business days. Shipping is complimentary on orders over ₹5,000.</p></details><details id="returns"><summary>What is your returns policy?<ChevronDown size={16} /></summary><p>We offer easy returns within 30 days of delivery, provided items are unworn and in original condition.</p></details><details id="privacy"><summary>How do you handle my information?<ChevronDown size={16} /></summary><p>This demo does not submit contact data to a server. A production store should publish a complete privacy policy before launch.</p></details></section></div>;
}

function NewsletterInline() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  return done ? <span className="subscribe-success"><Check size={16} /> Thanks — no email was sent in this demo.</span> : <form className="newsletter-form newsletter-form-large" onSubmit={(event) => { event.preventDefault(); if (email.trim()) setDone(true); }}><label className="sr-only" htmlFor="home-newsletter">Your email address</label><input id="home-newsletter" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" required /><button>Count me in <ArrowRight size={16} /></button></form>;
}

function EmptyState({ title, detail, action, to }: { title: string; detail: string; action: string; to: string }) {
  return <div className="empty-state"><div className="empty-icon"><ShoppingBag size={24} /></div><h2>{title}</h2><p>{detail}</p><Link className="button button-dark" to={to}>{action} <ArrowRight size={16} /></Link></div>;
}

export default App;
