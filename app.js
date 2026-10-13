const API = 'https://food-ordering-backend-qrj1.onrender.com/api';
let foods = [], cart = JSON.parse(localStorage.getItem('foodie-cart') || '{}');
let currentUser = null, activeCategory = 'All';
const $ = (id) => document.getElementById(id);
const money = n => '₹' + Number(n).toLocaleString('en-IN', {maximumFractionDigits:2});
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path, options={}) {
  const res = await fetch(API + path, {credentials:'include', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options});
  const raw = await res.text(); let data = null; try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2400)}
function saveCart(){localStorage.setItem('foodie-cart',JSON.stringify(cart));updateCartCount()}
function updateCartCount(){$('cartCount').textContent=Object.values(cart).reduce((a,n)=>a+Number(n),0)}
function openModal(html){$('modalContent').innerHTML=html;$('modalOverlay').classList.remove('hidden')}
function closeModal(){$('modalOverlay').classList.add('hidden')}
function renderAccount(){
  $('accountArea').innerHTML = currentUser
    ? `<span class="muted">Hi, ${safe(currentUser.name.split(' ')[0])}</span><button class="btn btn-outline" id="logoutBtn">Logout</button>`
    : '<button class="btn btn-outline" id="loginOpen">Login</button><button class="btn btn-primary" id="registerOpen">Sign up</button>';
  $('loginOpen')?.addEventListener('click',()=>authModal('login'));
  $('registerOpen')?.addEventListener('click',()=>authModal('register'));
  $('logoutBtn')?.addEventListener('click',logout);
}
function authModal(mode){
  const register=mode==='register';
  openModal(`<span class="eyebrow">${register?'JOIN THE TABLE':'WELCOME BACK'}</span><h2>${register?'Create your account':'Login to Foodie'}</h2><p>${register?'Create an account to place orders and track deliveries.':'Sign in to order your favourites and see your order history.'}</p>
  <form id="authForm">${register?'<div class="field"><label for="authName">Full name</label><input id="authName" required minlength="2" autocomplete="name" placeholder="Your name"></div>':''}
  <div class="field"><label for="authEmail">Email address</label><input id="authEmail" type="email" required autocomplete="email" placeholder="you@example.com"></div>
  <div class="field"><label for="authPassword">Password</label><input id="authPassword" type="password" required minlength="${register?6:1}" autocomplete="${register?'new-password':'current-password'}" placeholder="${register?'At least 6 characters':'Your password'}"></div>
  <button class="btn btn-primary" type="submit">${register?'Create account':'Login'}</button></form>
  <div class="switch-auth">${register?'Already have an account?':'New to Foodie?'} <button class="text-btn" id="switchAuth">${register?'Login':'Sign up'}</button></div>`);
  $('authForm').addEventListener('submit',async e=>{e.preventDefault();const body={email:$('authEmail').value.trim(),password:$('authPassword').value};if(register)body.name=$('authName').value.trim();try{currentUser=await api('/auth/'+mode,{method:'POST',body:JSON.stringify(body)});closeModal();renderAccount();toast(register?'Account created. Welcome!':'You are logged in');loadOrders()}catch(err){toast(err.message)}});
  $('switchAuth').addEventListener('click',()=>authModal(register?'login':'register'));
}
async function logout(){try{await api('/auth/logout',{method:'POST'});currentUser=null;renderAccount();$('ordersList').innerHTML='<p class="muted">Log in to see your order history.</p>';toast('Logged out')}catch(e){toast(e.message)}}
async function loadFoods(){try{foods=await api('/foods/available');renderFoods()}catch(e){$('foodGrid').innerHTML=`<div class="empty">Could not connect to the backend.<br>Start Spring Boot on <b>localhost:8080</b> and refresh.</div>`}}
function renderFoods(){
 const query=$('searchInput').value.toLowerCase().trim();
 const filtered=foods.filter(f=>(activeCategory==='All'||f.category===activeCategory)&&(`${f.name} ${f.description} ${f.category}`).toLowerCase().includes(query));
 $('foodGrid').innerHTML=filtered.length?filtered.map(f=>`<article class="food-card"><div class="food-image"><img src="${safe(f.imageUrl||'')}" alt="${safe(f.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x400/f3e8da/6b5a48?text=Foodie'"><span class="food-category">${safe(f.category)}</span></div><div class="food-info"><div class="food-title-row"><h3>${safe(f.name)}</h3><span class="food-price">${money(f.price)}</span></div><p>${safe(f.description)}</p><button class="add-btn" data-add="${f.id}">＋ Add to cart</button></div></article>`).join(''):'<div class="empty">No items found. Try another search.</div>';
 document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.add;cart[id]=(cart[id]||0)+1;saveCart();toast('Added to cart')}));
}
function renderCart(){
 const entries=Object.entries(cart).filter(([id,q])=>q>0&&foods.some(f=>String(f.id)===String(id)));
 const total=entries.reduce((sum,[id,q])=>sum+foods.find(f=>String(f.id)===String(id)).price*q,0);
 openModal(`<span class="eyebrow">YOUR SELECTION</span><h2>Your cart</h2><p>Good choices. Check your items before checkout.</p>
 ${entries.length?entries.map(([id,q])=>{const f=foods.find(x=>String(x.id)===String(id));return `<div class="cart-line"><img src="${safe(f.imageUrl)}" alt=""><div class="cart-line-info"><strong>${safe(f.name)}</strong><small>${money(f.price)} each</small></div><div class="qty"><button data-minus="${id}">−</button><b>${q}</b><button data-plus="${id}">＋</button></div></div>`}).join(''):'<div class="empty">Your cart is empty. Add something delicious!</div>'}
 <div class="cart-total"><span>Total</span><span>${money(total)}</span></div>
 ${entries.length?`<button class="btn btn-primary" id="checkoutBtn">Continue to checkout →</button>`:''}`);
 document.querySelectorAll('[data-minus]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.minus;cart[id]--;if(cart[id]<=0)delete cart[id];saveCart();renderCart()}));
 document.querySelectorAll('[data-plus]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.plus;cart[id]++;saveCart();renderCart()}));
 $('checkoutBtn')?.addEventListener('click',()=>{if(!currentUser){toast('Please login before checkout');authModal('login');return}checkoutModal()});
}
function checkoutModal(){
 const user=currentUser;
 openModal(`<span class="eyebrow">ALMOST THERE</span><h2>Delivery details</h2><p>Pay safely on delivery. Online payment is not enabled in this demo.</p>
 <form id="checkoutForm"><div class="field"><label for="customerName">Full name</label><input id="customerName" required value="${safe(user.name)}"></div>
 <div class="field"><label for="customerEmail">Email</label><input id="customerEmail" type="email" required value="${safe(user.email)}"></div>
 <div class="field"><label for="address">Delivery address</label><textarea id="address" required placeholder="House/flat, street, area, city, PIN code"></textarea></div>
 <div class="field"><label for="payment">Payment method</label><select id="payment"><option value="CASH_ON_DELIVERY">Cash on delivery</option></select></div>
 <button class="btn btn-primary" type="submit">Place order · ${money(Object.entries(cart).reduce((sum,[id,q])=>sum+(foods.find(f=>String(f.id)===String(id))?.price||0)*q,0))}</button></form>`);
 $('checkoutForm').addEventListener('submit',async e=>{e.preventDefault();const items=Object.entries(cart).map(([foodId,quantity])=>({foodId:Number(foodId),quantity}));try{const order=await api('/orders',{method:'POST',body:JSON.stringify({customerName:$('customerName').value.trim(),email:$('customerEmail').value.trim(),address:$('address').value.trim(),paymentMethod:$('payment').value,items})});cart={};saveCart();closeModal();toast(`Order #${order.id} placed successfully!`);loadOrders();$('orders').scrollIntoView({behavior:'smooth'})}catch(err){toast(err.message)}});
}
async function loadOrders(){
 if(!currentUser){$('ordersList').innerHTML='<p class="muted">Log in to see your order history.</p>';return}
 try{const orders=await api('/orders/my');$('ordersList').innerHTML=orders.length?orders.map(o=>`<article class="order-card"><div><h3>Order #${o.id} · ${money(o.total)}</h3><p>${new Date(o.createdAt).toLocaleString()} · ${(o.items||[]).map(i=>`${safe(i.foodName)} × ${i.quantity}`).join(', ')}</p><p>${safe(o.address)}</p></div><span class="status">${safe(String(o.status).replaceAll('_',' '))}</span></article>`).join(''):'<div class="empty">No orders yet. Your next favourite meal is waiting!</div>'}
 catch(e){$('ordersList').innerHTML=`<p class="muted">${safe(e.message)}. Please log in again.</p>`}
}
$('modalClose').addEventListener('click',closeModal);
$('modalOverlay').addEventListener('click',e=>{if(e.target===$('modalOverlay'))closeModal()});
$('cartOpen').addEventListener('click',renderCart);
$('loginOpen').addEventListener('click',()=>authModal('login'));
$('registerOpen').addEventListener('click',()=>authModal('register'));
$('searchInput').addEventListener('input',renderFoods);
$('filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;activeCategory=b.dataset.category;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderFoods()});
$('refreshOrders').addEventListener('click',loadOrders);
async function init(){updateCartCount();renderAccount();await loadFoods();try{currentUser=await api('/auth/me');renderAccount();loadOrders()}catch{}}
init();
