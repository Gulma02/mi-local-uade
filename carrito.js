document.addEventListener('DOMContentLoaded', () => {
  const products = [
        { id: 'cl10', name: '10 clases bartender', price: 15000, img: './img/clase10.jpg' },
        { id: 'cl20', name: '20 clases bartender', price: 27000, img: './img/beach-bar.jpg' },
        { id: 'catering', name: 'Servicio de catering', price: 45000, img: './img/catering.jpg' },
        { id: 'barra', name: 'Servicio de barra (personal + insumos)', price: 35000, img: './img/ronda-barra.png' },
        { id: 'cerrar_bar', name: 'Cerrar el bar para evento privado (por noche)', price: 80000, img: './img/beach-bar.jpg' },
        { id: 'negroni_rondo', name: 'Negroni Rondo', price: 1200, img: './img/negroni.jpg', type: 'drink' },
        { id: 'ronda_sour', name: 'Ronda Sour', price: 1100, img: './img/ronda_sour.jpg', type: 'drink' },
        { id: 'citrus_smash', name: 'Citrus Smash', price: 950, img: './img/citrus_smash.webp', type: 'drink' },
        { id: 'espresso_ronda', name: 'Espresso Ronda', price: 1300, img: './img/espresso.jpg', type: 'drink' },
        { id: 'tropical_fizz', name: 'Tropical Fizz', price: 900, img: './img/tropical_fizz.jpg', type: 'drink' }
  ];

  const productList = document.getElementById('product-list');
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const clearCartBtn = document.getElementById('clear-cart-btn');

  let cart = loadCart();

  function saveCart() {
    localStorage.setItem('mi_local_cart', JSON.stringify(cart));
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem('mi_local_cart')) || {};
    } catch {
      return {};
    }
  }

  const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  function formatMoney(amount) {
    return moneyFmt.format(amount);
  }

  function renderProducts() {
    productList.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" class="product-img" onerror="this.src='./img/placeholder.png'">
        <h3>${p.name}</h3>
        <p class="price">${formatMoney(p.price)}</p>
        <button class="add-btn" data-id="${p.id}">Agregar</button>
      `;
      productList.appendChild(card);
    });
  }

  function getProductById(id) {
    return products.find(p => p.id === id);
  }

  function addToCart(id, qty = 1) {
    cart[id] = (cart[id] || 0) + qty;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    delete cart[id];
    saveCart();
    renderCart();
  }

  function setQty(id, qty) {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    cart[id] = qty;
    saveCart();
    renderCart();
  }

  function calculateTotals() {
    let subtotal = 0;
    let totalUnits = 0;
    const unitList = [];

    for (const [id, qty] of Object.entries(cart)) {
      const p = getProductById(id);
      if (!p) continue;
      subtotal += p.price * qty;
      totalUnits += qty;
      for (let i = 0; i < qty; i++) unitList.push({ id, price: p.price });
    }

    // Descuento 3x2 en tragos
    let drinkDiscount = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = getProductById(id);
      if (!p) continue;
      if (p.type === 'drink') {
        const freeUnits = Math.floor(qty / 3);
        drinkDiscount += freeUnits * p.price;
      }
    }

    // Promoción 2 unidades -> segunda unidad 50% (si hay exactamente 2 unidades en total)
    let twoUnitDiscount = 0;
    if (totalUnits === 2 && unitList.length === 2) {
      const cheaperUnit = unitList.reduce((a, b) => (a.price <= b.price ? a : b));
      twoUnitDiscount = Math.round(cheaperUnit.price * 0.5);
    }

    const promoDiscount = drinkDiscount + twoUnitDiscount;
    const afterPromos = subtotal - promoDiscount;

    let bulkDiscount = 0;
    const BULK_THRESHOLD = 30000;
    const BULK_RATE = 0.10;
    if (afterPromos > BULK_THRESHOLD) {
      bulkDiscount = Math.round(afterPromos * BULK_RATE);
    }

    const total = afterPromos - bulkDiscount;
    return {
      subtotal,
      drinkDiscount,
      twoUnitDiscount,
      promoDiscount,
      bulkDiscount,
      totalUnits,
      total
    };
  }

  function renderCart() {
    cartItemsEl.innerHTML = '';
    const ids = Object.keys(cart);
    if (ids.length === 0) {
      cartItemsEl.innerHTML = '<p>El carrito está vacío.</p>';
      cartTotalEl.textContent = 'Total: ' + formatMoney(0);
      return;
    }

    ids.forEach(id => {
      const qty = cart[id];
      const p = getProductById(id);
      if (!p) return;
      const subtotalItem = p.price * qty;

      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <div class="ci-left"><img src="${p.img}" alt="${p.name}" onerror="this.src='./img/placeholder.png'"></div>
        <div class="ci-mid">
          <strong>${p.name}</strong>
          <div>${formatMoney(p.price)} x ${qty} = ${formatMoney(subtotalItem)}</div>
        </div>
        <div class="ci-right">
          <button class="qty-decrease" data-id="${id}">-</button>
          <input type="number" class="qty-input" data-id="${id}" value="${qty}" min="1">
          <button class="qty-increase" data-id="${id}">+</button>
          <button class="remove-item" data-id="${id}">Eliminar</button>
        </div>
      `;
      cartItemsEl.appendChild(item);
    });

    const totals = calculateTotals();

    // Mostrar descuentos aplicados
    if (totals.drinkDiscount > 0) {
      const discEl = document.createElement('div');
      discEl.className = 'cart-discount';
      discEl.innerHTML = `<strong>Promoción 3x2 (tragos):</strong> -${formatMoney(totals.drinkDiscount)}`;
      cartItemsEl.appendChild(discEl);
    }
    if (totals.twoUnitDiscount > 0) {
      const discEl2 = document.createElement('div');
      discEl2.className = 'cart-discount';
      discEl2.innerHTML = `<strong>Promoción 2 unidades:</strong> segunda unidad 50% off -${formatMoney(totals.twoUnitDiscount)}`;
      cartItemsEl.appendChild(discEl2);
    }
    if (totals.bulkDiscount > 0) {
      const discEl3 = document.createElement('div');
      discEl3.className = 'cart-discount';
      discEl3.innerHTML = `<strong>Descuento por monto:</strong> 10% off por compra mayor a ${formatMoney(60000)} -${formatMoney(totals.bulkDiscount)}`;
      cartItemsEl.appendChild(discEl3);
    }

    cartTotalEl.textContent = `Total: ${formatMoney(totals.total)}`;
  }

  document.body.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if (addBtn) {
      const id = addBtn.dataset.id;
      addToCart(id, 1);
    }

    const removeBtn = e.target.closest('.remove-item');
    if (removeBtn) {
      removeFromCart(removeBtn.dataset.id);
    }

    const dec = e.target.closest('.qty-decrease');
    if (dec) {
      const id = dec.dataset.id;
      setQty(id, (cart[id] || 1) - 1);
    }

    const inc = e.target.closest('.qty-increase');
    if (inc) {
      const id = inc.dataset.id;
      setQty(id, (cart[id] || 0) + 1);
    }
  });

  document.body.addEventListener('change', (e) => {
    if (e.target.matches('.qty-input')) {
      const id = e.target.dataset.id;
      const val = parseInt(e.target.value, 10) || 0;
      setQty(id, val);
    }
  });

  checkoutBtn.addEventListener('click', () => {
    const ids = Object.keys(cart);
    if (ids.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const totals = calculateTotals();
    let resumen = 'Tu compra:\n\n';
    for (const id of ids) {
      const p = getProductById(id);
      const qty = cart[id];
      resumen += `${p.name} x ${qty} = ${formatMoney(p.price * qty)}\n`;
    }
    if (totals.drinkDiscount > 0) {
      resumen += `\nPromoción 3x2 (tragos): -${formatMoney(totals.drinkDiscount)}\n`;
    }
    if (totals.twoUnitDiscount > 0) {
      resumen += `\nPromoción 2 unidades: -${formatMoney(totals.twoUnitDiscount)}\n`;
    }
    if (totals.bulkDiscount > 0) {
      resumen += `\nDescuento 10% por monto: -${formatMoney(totals.bulkDiscount)}\n`;
    }
    resumen += `\nTotal a pagar: ${formatMoney(totals.total)}\n\nGracias por elegir Ronda Bar.`;
    alert(resumen);

    cart = {};
    saveCart();
    renderCart();
  });

  clearCartBtn.addEventListener('click', () => {
    if (confirm('¿Vaciar el carrito?')) {
      cart = {};
      saveCart();
      renderCart();
    }
  });

  renderProducts();
  renderCart();
});