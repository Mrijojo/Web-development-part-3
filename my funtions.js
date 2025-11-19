const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const on = (el, evt, selOrHandler, handlerIfSel) => {
  if (typeof selOrHandler === 'string') {
    el.addEventListener(evt, e => {
      const target = e.target.closest(selOrHandler);
      if (target && el.contains(target)) handlerIfSel.call(target, e);
    });
  } else {
    el.addEventListener(evt, selOrHandler);
  }
};
const createEl = (tag, attrs = {}, txt = '') => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (txt) el.textContent = txt;
  return el;
};

function initAccordions() {
  const accordions = $$('.accordion');
  accordions.forEach(acc => {
    on(acc, 'click', '.accordion-toggle', function (e) {
      const item = this.closest('.accordion-item');
      const panel = item.querySelector('.accordion-panel');
      const open = item.classList.toggle('open');
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0';
  
      if (open && acc.dataset.single === 'true') {
        $$('.accordion-item', acc).forEach(it => {
          if (it !== item) {
            it.classList.remove('open');
            const p = it.querySelector('.accordion-panel');
            if (p) p.style.maxHeight = '0';
          }
        });
      }
    });
  
    $$('.accordion-panel', acc).forEach(p => { p.style.overflow = 'hidden'; p.style.maxHeight = '0'; p.style.transition = 'max-height 0.35s ease'; });
  });
}

function initTabs() {
  $$('.tabs[data-tabs]').forEach(tabs => {
    const nav = $('.tabs-nav', tabs);
    on(nav, 'click', 'button[data-tab]', function () {
      const key = this.dataset.tab;
      $$('.tabs-nav button', tabs).forEach(b => b.classList.toggle('active', b === this));
      $$('[data-panel]', tabs).forEach(p => p.style.display = (p.dataset.panel === key) ? '' : 'none');
    });
   
    const first = $('button[data-tab]', nav);
    if (first) first.click();
  });
}

function initModals() {
  on(document, 'click', '[data-modal-target]', function (e) {
    const id = this.dataset.modalTarget;
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  on(document, 'click', '.modal .modal-close', function () {
    const modal = this.closest('.modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
  });
  on(document, 'click', '.modal.open', function (e) {
    if (e.target === this) { this.classList.remove('open'); document.body.style.overflow = ''; }
  });
}

function initGalleryLightbox() {
  const gallery = $('.gallery');
  if (!gallery) return;

  const lightbox = createEl('div', { class: 'modal lightbox', id: 'lightbox' });
  lightbox.innerHTML = `<div class="lightbox-inner"><button class="modal-close">&times;</button><img class="lightbox-img" alt=""><div class="lightbox-caption"></div></div>`;
  document.body.appendChild(lightbox);

  const style = document.createElement('style');
  style.textContent = `
    .modal.lightbox{ display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); align-items:center; justify-content:center; z-index:9999;}
    .modal.lightbox.open{ display:flex; }
    .lightbox-inner{ position:relative; max-width:90%; max-height:90%; }
    .lightbox-inner img{ max-width:100%; max-height:80vh; display:block; margin:0 auto; border-radius:8px; }
    .lightbox-caption{ color:#fff; text-align:center; margin-top:10px; }
    .modal .modal-close{ position:absolute; right:-10px; top:-10px; background:#fff; border-radius:50%; width:36px; height:36px; font-size:20px; border:none; cursor:pointer;}
  `;
  document.head.appendChild(style);

  on(gallery, 'click', 'img', function () {
    const src = this.getAttribute('src');
    const alt = this.getAttribute('alt') || '';
    $('.lightbox-img', lightbox).setAttribute('src', src);
    $('.lightbox-caption', lightbox).textContent = alt;
    lightbox.classList.add('open');
  });
  on(lightbox, 'click', '.modal-close', function () { lightbox.classList.remove('open'); });
  on(lightbox, 'click', function (e) { if (e.target === lightbox) lightbox.classList.remove('open'); });
}

const sampleProducts = [
  {id:1, title:'Healthy Executive Platter', category:'Platters', price:350, tags:['healthy','executive']},
  {id:2, title:'Vegan Platter', category:'Platters', price:300, tags:['vegan']},
  {id:3, title:'Gourmet Cheese & Cold Meat', category:'Platters', price:420, tags:['gourmet']},
  {id:4, title:'Individual Pre-Packed Meal', category:'Meals', price:85, tags:['individual','prepacked']},
];

function renderProducts(list = sampleProducts) {
  const container = $('#products');
  const tpl = document.getElementById('product-template');
  if (!container || !tpl) {

    const fallback = createEl('div', { id: 'products' });
    document.body.appendChild(fallback);
    fallback.innerHTML = '<p class="muted">(Products container not found — sample data loaded into console)</p>';
    console.table(list);
    return;
  }
  container.innerHTML = '';
  list.forEach(item => {
    const clone = tpl.content.cloneNode(true);
    const root = clone.querySelector('[data-product-id]');
    if (root) root.dataset.productId = item.id;
    const title = clone.querySelector('.product-title'); if (title) title.textContent = item.title;
    const cat = clone.querySelector('.product-category'); if (cat) cat.textContent = item.category;
    const price = clone.querySelector('.product-price'); if (price) price.textContent = `R ${item.price}`;
   
    on(clone, 'click', '.enquire-btn', function () {
     
      const em = $('#enquiryModal'); if (em) { em.classList.add('open'); const f = $('#enquiry-form'); if (f) f.querySelector('[name="product"]').value = item.title; }
    });
    container.appendChild(clone);
  });
}

function initSearchAndSort() {
  const searchInput = $('#search-input');
  const sortSelect = $('#sort-select');
  function applyFilters() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const sortVal = sortSelect ? sortSelect.value : '';
    let filtered = sampleProducts.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.tags.join(' ')||'').includes(q));
    if (sortVal === 'price-asc') filtered.sort((a,b)=>a.price-b.price);
    if (sortVal === 'price-desc') filtered.sort((a,b)=>b.price-a.price);
    renderProducts(filtered);
  }
  if (searchInput) on(searchInput, 'input', applyFilters);
  if (sortSelect) on(sortSelect, 'change', applyFilters);
 
  renderProducts(sampleProducts);
}

function serializeForm(form) {
  return Array.from(new FormData(form)).reduce((o, [k, v]) => { o[k]=v; return o; }, {});
}

function validateForm(form) {
 
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  const phone = form.querySelector('[name="cn"], [name="contact"], [name="phone"]');
  if (phone && phone.value) {
    const clean = phone.value.replace(/\s+/g,'');
    const phoneReg = /^\+?\d{8,15}$/;
    if (!phoneReg.test(clean)) { alert('Please enter a valid phone number (digits, may include +).'); phone.focus(); return false; }
  }
  return true;
}

async function ajaxSubmit(form) {
  const data = serializeForm(form);
  try {
    const resp = await fetch(form.action || '/api/submit', {
      method: form.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('Network response not OK');
    const json = await resp.json();
    return { success: true, response: json };
  } catch (err) {
    if (form.dataset.formType === 'contact') {
      const to = form.dataset.recipient || 'The.realfoodco.20@gmail.com';
      const subject = encodeURIComponent(data.subject || 'Website contact form');
      const body = encodeURIComponent(Object.entries(data).map(([k,v])=>`${k}: ${v}`).join('\n'));
      const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
      window.location.href = mailto;
      return { success: true, fallback: 'mailto' };
    } else {
      const quoted = { costEstimate: Math.round((Math.random()*5+1)*100), availability: 'Please contact us to confirm' };
      return { success: true, response: quoted, fallback: true };
    }
  }
}

function initForms() {
  on(document, 'submit', 'form', async function (e) {
    e.preventDefault();
    const form = this;
   
    const type = form.dataset.formType || form.id || '';
    if (!type.toLowerCase().includes('contact') && !type.toLowerCase().includes('enquiry') && !type.toLowerCase().includes('review')) {

      if (!form.checkValidity()) return form.reportValidity();
      return;
    }
    if (!validateForm(form)) return;
    const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');
    const oldText = submitBtn ? submitBtn.textContent : null;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    const result = await ajaxSubmit(form);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = oldText; }
    if (result && result.success) {
      if (form.dataset.formType && form.dataset.formType === 'enquiry') {
        alert('Thank you — we received your enquiry. A cost estimate (simulated) is: ' + (result.response && result.response.costEstimate ? `R ${result.response.costEstimate}` : 'n/a'));
      } else {
        alert('Thank you — your message was sent. We will contact you soon.');
      }
      form.reset();
      localStorage.setItem('lastSubmission', JSON.stringify({ time:Date.now(), data: serializeForm(form) }));
    } else {
      alert('Sorry — there was an error submitting your form. Please try contacting via email or WhatsApp.');
    }
  });
  $$('form[data-draft="true"]').forEach(form => {
    const key = 'draft-' + (form.id || form.name || 'form');
    const draft = localStorage.getItem(key);
    if (draft) {
      try {
        const obj = JSON.parse(draft);
        Object.entries(obj).forEach(([k,v]) => {
          const el = form.elements[k];
          if (el) el.value = v;
        });
      } catch (e) {}
    }

    on(form, 'input', function () {
      const data = serializeForm(form);
      localStorage.setItem(key, JSON.stringify(data));
    });
  });
}

function initLeafletMap() {
  if (typeof L === 'undefined') {
    return;
  }
  const mapEl = document.getElementById('map');
  if (!mapEl) return;
  const lat = parseFloat(mapEl.dataset.lat) || -25.8996;
  const lng = parseFloat(mapEl.dataset.lng) || 28.1510;
  const zoom = parseInt(mapEl.dataset.zoom || '13', 10);
  const map = L.map(mapEl).setView([lat,lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([lat,lng]).addTo(map).bindPopup('The Real Food Co.').openPopup();
}

function initScrollAnimations() {
  const els = $$('.animate-on-scroll');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(el => { el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; el.style.opacity = 0; el.style.transform = 'translateY(10px)'; obs.observe(el); });
}

function initAll() {
  initAccordions();
  initTabs();
  initModals();
  initGalleryLightbox();
  initSearchAndSort();
  initForms();
  initLeafletMap();
  initScrollAnimations();
  
  console.info('main.js initialized: accordions, tabs, modals, gallery, search, forms, map (if leaflet loaded).');
}

document.addEventListener('DOMContentLoaded', initAll);
