import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

"use strict";

/* =========================
   STORAGE HELPERS
========================= */

async function getProducts() {

  const snapshot = await getDocs(
    collection(db, "products")
  );

  let products = [];

  snapshot.forEach(item => {

    products.push({
      id: item.id,
      ...item.data()
    });

  });

  return products;
}

function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   GLOBAL DATA
========================= */

let products = [];
let cart = getCart();
let pdfDownloaded = false;

/* =========================
   SIDEBAR SYSTEM (HOME + PRODUCT)
========================= */

function updateOverlay() {
  const menu = document.getElementById("sidebarMenu");
  const cartEl = document.getElementById("sidebarCart");
  const overlay = document.getElementById("overlay");

  const menuOpen = menu?.classList.contains("active");
  const cartOpen = cartEl?.classList.contains("active");

  if (!overlay) return;

  overlay.classList.toggle("active", menuOpen || cartOpen);
  document.body.classList.toggle("no-scroll", menuOpen || cartOpen);
}

function toggleMenu() {
  const menu = document.getElementById("sidebarMenu");
  const cartEl = document.getElementById("sidebarCart");

  if (!menu || !cartEl) return;

  cartEl.classList.remove("active");
  menu.classList.toggle("active");

  updateOverlay();
}

function toggleCart() {
  const menu = document.getElementById("sidebarMenu");
  const cartEl = document.getElementById("sidebarCart");

  if (!menu || !cartEl) return;

  menu.classList.remove("active");
  cartEl.classList.toggle("active");

  updateOverlay();
}

function closeAllSidebars() {
  document.getElementById("sidebarMenu")?.classList.remove("active");
  document.getElementById("sidebarCart")?.classList.remove("active");

  updateOverlay();
}

/* =========================
   NAVIGATION
========================= */

function goHome() {
  window.location.href = "Virethos.html";
}

function goProducts() {
  window.location.href = "Virethos.html?page=products";
}

/* =========================
   RENDER PRODUCTS (PAGE LISTE)
========================= */

function renderProducts() {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  container.innerHTML = "";

  products.forEach(p => {
    const img =
      (Array.isArray(p.images) && p.images[0]) ||
      p.img ||
      "";

    container.innerHTML += `
      <a href="product.html?id=${p.id}" class="product-link">
        <div class="product-card">

          <div class="product-image">
            <img src="${img}" alt="${p.name}">
          </div>

          <div class="product-info">
            <h3>${p.name}</h3>
            <p class="price">${p.price} DH</p>

            <span class="stock ${p.stock ? "ok" : "no"}">
              ${p.stock ? "En stock" : "Rupture"}
            </span>

            <button onclick="event.preventDefault(); addToCart('${p.id}')">
              Ajouter au panier
            </button>

          </div>
        </div>
      </a>
    `;
  });
}

/* =========================
   ADD TO CART
========================= */

function addToCart(id, qty = 1) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;

  if (!product.stock) {
    alert("Produit indisponible");
    return;
  }

  const existing = cart.find(i => i.id === product.id);
  const available = Number(product.quantity);

  if (Number.isFinite(available)) {
    const currentQuantity = existing ? existing.quantity || 1 : 0;

    if (currentQuantity + qty > available) {
      alert("Stock insuffisant");
      return;
    }
  }

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      img:
        (Array.isArray(product.images) && product.images[0]) ||
        product.img ||
        "",
      quantity: qty
    });
  }

  saveCart(cart);
  renderCart();
}

/* =========================
   CART RENDER
========================= */

function renderCart() {
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!container || !totalEl) return;

  container.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    const img = (Array.isArray(item.images) && item.images[0]) || item.img || "";
    total += Number(item.price) * item.quantity;

    container.innerHTML += `
      <div class="cart-item">

        <img src="${img}" alt="${item.name}">

        <div class="cart-details">
          <strong>${item.name}</strong>
          <p>${item.price} DH</p>

          <div class="quantity-controls">
            <button class="qty-btn" onclick="changeQty(${index}, -1)" aria-label="Diminuer la quantite">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="changeQty(${index}, 1)" aria-label="Augmenter la quantite">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})" aria-label="Retirer du panier">x</button>

      </div>
    `;
  });

  totalEl.textContent = total + " DH";
}

function changeQty(index, value) {
  if (!cart[index]) return;

  cart[index].quantity += value;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

/* =========================
   CHECKOUT SYSTEM
========================= */

function checkout() {

  if (cart.length === 0) {
    alert("Panier vide");
    return;
  }

  const modal = document.getElementById("checkoutModal");

  if (!modal) return;

  renderOrderSummary();

  modal.classList.add("active");
}


function closeCheckout() {

  const modal = document.getElementById("checkoutModal");

  if (!modal) return;

  modal.classList.remove("active");
}


function renderOrderSummary() {

  const summary = document.getElementById("orderSummary");

  if (!summary) return;


  let total = 0;

  let html = "<h3>Votre commande</h3>";


  cart.forEach(item => {

    const quantity = item.quantity || 1;

    const price = Number(item.price) * quantity;

    total += price;


    html += `
      <p>
        ${item.name} x${quantity}
        - ${price} DH
      </p>
    `;

  });


  html += `
    <hr>
    <strong>Total : ${total} DH</strong>
  `;


  summary.innerHTML = html;

}

/* =========================
   PRODUCT PAGE
========================= */

function initProductPage() {
  const container = document.getElementById("productDetails");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const product = products.find(p => String(p.id) === String(id));

  if (!product) {
    container.innerHTML = "<h2>Produit introuvable</h2>";
    return;
  }

  let images =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : product.img
      ? [product.img]
      : [];

  let current = 0;
  let qty = 1;
  let startX = 0;
  let endX = 0;

  container.innerHTML = `
    <div class="product-page">

      <div class="gallery">

        <div class="slider">

          <button class="slider-btn prev" onclick="prevImg()" aria-label="Photo precedente">&lt;</button>

          <img id="mainImage" src="${images[0] || ""}">

          <button class="slider-btn next" onclick="nextImg()" aria-label="Photo suivante">&gt;</button>

        </div>

        <div id="dots" class="image-progress"></div>

      </div>

      <div class="info">

        <h1>${product.name}</h1>

        <div class="price">${product.price} DH</div>

        <div class="${product.stock ? "ok" : "no"}">
          ${product.stock ? "En stock" : "Rupture"}
        </div>

        <div class="qty">
          <button onclick="changeQtyLocal(-1)">-</button>
          <span id="qty">${qty}</span>
          <button onclick="changeQtyLocal(1)">+</button>
        </div>

        <button onclick="addToCart('${product.id}', getQty())">
          Ajouter au panier
        </button>

      </div>

    </div>
  `;

  window.getQty = () => qty;

  window.changeQtyLocal = (v) => {
    qty += v;
    if (qty < 1) qty = 1;
    document.getElementById("qty").textContent = qty;
  };

  function updateImage() {
    const mainImage = document.getElementById("mainImage");
    if (mainImage) mainImage.src = images[current] || "";

    document.querySelectorAll(".progress-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === current);
    });
  }

  function renderImageProgress() {
    const dots = document.getElementById("dots");
    if (!dots) return;

    dots.innerHTML = images.map((_, index) => `
      <button
        class="progress-dot ${index === current ? "active" : ""}"
        onclick="goToImg(${index})"
        aria-label="Afficher la photo ${index + 1}">
      </button>
    `).join("");
  }

  const slider = document.querySelector(".slider");

  if (slider) {
    slider.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].clientX;

      const diff = startX - endX;

      if (Math.abs(diff) < 50) return;

      if (diff > 0) {
        window.nextImg();
      } else {
        window.prevImg();
      }
    }, { passive: true });
  }

  window.goToImg = (index) => {
    if (!images[index]) return;
    current = index;
    updateImage();
  };

  window.nextImg = () => {
    if (!images.length) return;
    current = (current + 1) % images.length;
    updateImage();
  };

  window.prevImg = () => {
    if (!images.length) return;
    current = (current - 1 + images.length) % images.length;
    updateImage();
  };

  renderImageProgress();
}

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", async () => {

  products = await getProducts();

  renderProducts();
  renderCart();
  initProductPage();

});

async function sendOrderEmail() {

  const name = document.getElementById("customerName").value;
  const phone = document.getElementById("customerPhone").value;
  const city = document.getElementById("customerCity").value;
  const address = document.getElementById("customerAddress").value;


  const cart = JSON.parse(localStorage.getItem("cart") || "[]");


  let orderText = "";
  let total = 0;


  cart.forEach(item => {

    const price = Number(item.price) * item.quantity;

    total += price;

    orderText += `${item.name} x${item.quantity} = ${price} DH\n`;

  });


  // 1) ENREGISTRER LA COMMANDE DANS FIREBASE

  await addDoc(collection(db, "orders"), {

    customerName: name,
    phone,
    city,
    address,

    items: cart,

    total,

    createdAt: new Date()

  });



  // 2) DIMINUER LE STOCK

  for (const item of cart) {

    const productRef = doc(db, "products", item.id);


    const product = products.find(
      p => String(p.id) === String(item.id)
    );


    if(product){

      const newQuantity =
        Math.max(
          0,
          Number(product.quantity) - Number(item.quantity)
        );


      await updateDoc(productRef, {

        quantity: newQuantity,

        stock: newQuantity > 0

      });

    }

  }



  // 3) ENVOYER EMAIL

  const templateParams = {

    customer_name: name,
    customer_phone: phone,
    customer_city: city,
    customer_address: address,

    order_details: orderText,

    total_price: total + " DH"

  };


  return emailjs.send(
    "service_1mko34u",
    "template_9llr32y",
    templateParams
  );

}


// ECOUTE DU FORMULAIRE
document.getElementById("checkoutForm")?.addEventListener("submit", function(e){

  e.preventDefault();


  sendOrderEmail()

  .then(() => {

    closeCheckout();

    showSuccess();

  })


  .catch((error)=>{

    console.log("Erreur EmailJS :", error);

    alert("Erreur lors de l'envoi de la commande ❌");

  });

});

function showSuccess() {

    window.lastCustomer = {
        name: document.getElementById("customerName").value,
        phone: document.getElementById("customerPhone").value,
        city: document.getElementById("customerCity").value,
        address: document.getElementById("customerAddress").value
    };

    document.getElementById("orderSuccess").classList.add("active");

    pdfDownloaded = false;

}

function closeSuccess() {

    if (!pdfDownloaded) {

        const confirmLeave = confirm(
            "Vous n'avez pas téléchargé votre commande.\n\nVoulez-vous vraiment continuer ?"
        );

        if (!confirmLeave) return;

    }

    document.getElementById("orderSuccess").classList.remove("active");

}

function downloadOrder() {

    pdfDownloaded = true;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const name = window.lastCustomer.name;
    const phone = window.lastCustomer.phone;
    const city = window.lastCustomer.city;
    const address = window.lastCustomer.address;

    let y = 20;

    // Fond général
    doc.setFillColor(13, 15, 20);
    doc.rect(0, 0, 210, 297, "F");


    // Bandeau du haut
    doc.setFillColor(122, 31, 31);
    doc.rect(0, 0, 210, 35, "F");


    // Nom du site
    doc.setTextColor(255,255,255);
    doc.setFontSize(26);
    doc.text("VIRETHOS", 105, 20, {
        align: "center"
    });


    doc.setFontSize(12);
    doc.text(
        "Merci pour votre commande",
        105,
        29,
        {align:"center"}
    );


    y = 55;


    // Informations client
    doc.setTextColor(255,255,255);
    doc.setFontSize(15);

    doc.text("Informations client",20,y);

    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(199,204,214);


    doc.text(`Nom : ${name}`,20,y);
    y += 8;

    doc.text(`Téléphone : ${phone}`,20,y);
    y += 8;

    doc.text(`Ville : ${city}`,20,y);
    y += 8;

    doc.text(`Adresse : ${address}`,20,y);


    y += 20;


    // Produits
    doc.setTextColor(255,255,255);
    doc.setFontSize(15);

    doc.text("Détails de la commande",20,y);


    y += 10;


    // Ligne séparation
    doc.setDrawColor(122,31,31);
    doc.line(20,y,190,y);

    y += 10;


    doc.setFontSize(12);

    let total = 0;


    cart.forEach(item => {

        const quantity = item.quantity || 1;
        const price = Number(item.price) * quantity;

        total += price;


        doc.setTextColor(199,204,214);

        doc.text(
            `${item.name}`,
            20,
            y
        );


        doc.text(
            `x${quantity}`,
            120,
            y
        );


        doc.text(
            `${price} DH`,
            150,
            y
        );


        y += 8;

    });


    y += 10;


    // Total
    doc.setFillColor(122,31,31);

    doc.rect(
    20,
    y,
    170,
    20,
    "F"
    );


    doc.setTextColor(255,255,255);

    doc.setFontSize(16);

    doc.text(
        `TOTAL : ${total} DH`,
        105,
        y+13,
        {
            align:"center"
        }
    );


    y += 40;


    doc.setFontSize(11);

    doc.setTextColor(150,150,150);

    doc.text(
        "Merci d'avoir choisi Virethos",
        105,
        y,
        {
            align:"center"
        }
    );


    doc.save("Commande_Virethos.pdf");

}

window.toggleMenu = toggleMenu;
window.toggleCart = toggleCart;
window.closeAllSidebars = closeAllSidebars;
window.goHome = goHome;
window.goProducts = goProducts;
window.checkout = checkout;
window.closeCheckout = closeCheckout;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeItem = removeItem;
window.nextImg = window.nextImg;
window.prevImg = window.prevImg;
window.closeSuccess = closeSuccess;
window.downloadOrder = downloadOrder;
window.addToCart = addToCart;
window.renderCart = renderCart;
window.goToImg = window.goToImg;