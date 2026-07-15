console.log("Virethos.js chargé");

import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* =========================
   OVERLAY & SIDEBARS
========================= */

function updateOverlay() {
  const menuOpen =
    document.getElementById("sidebarMenu").classList.contains("active");

  const cartOpen =
    document.getElementById("sidebarCart").classList.contains("active");

  document.getElementById("overlay")
    .classList.toggle("active", menuOpen || cartOpen);

  document.body.classList.toggle("no-scroll", menuOpen || cartOpen);
}

function toggleMenu() {
  const menu = document.getElementById("sidebarMenu");
  const cart = document.getElementById("sidebarCart");

  cart.classList.remove("active");
  menu.classList.toggle("active");

  updateOverlay();
}

function toggleCart() {
  const menu = document.getElementById("sidebarMenu");
  const cart = document.getElementById("sidebarCart");

  menu.classList.remove("active");
  cart.classList.toggle("active");

  updateOverlay();
}

function closeAllSidebars() {
  document.getElementById("sidebarMenu").classList.remove("active");
  document.getElementById("sidebarCart").classList.remove("active");

  updateOverlay();
}

/* =========================
   NAVIGATION
========================= */

function goHome() {
  showPage("home");
}

function goProducts() {
  showPage("products");
}

function showPage(page) {
  const home = document.getElementById("homePage");
  const products = document.getElementById("productsPage");

  if (!home || !products) return;

  if (page === "home") {
    home.style.display = "block";
    products.style.display = "none";
  }

  if (page === "products") {
    home.style.display = "none";
    products.style.display = "block";
  }

  closeAllSidebars();
}

/* =========================
   PRODUITS
========================= */

let products = [];
console.log("PRODUCTS =", products);

async function loadProducts() {

  const snapshot = await getDocs(
    collection(db, "products")
  );

  products = [];

  snapshot.forEach(item => {

    products.push({
      id: item.id,
      ...item.data()
    });

  });

  renderProducts();
}

function renderProducts() {

  const productsContainer =
    document.getElementById("productsContainer");

  if (!productsContainer) return;

  productsContainer.innerHTML = "";

  products.forEach((p, index) => {

    console.log("Produit affiché :", p);

    const img = (p.images && p.images[0]) || p.img || "";
    const productId = encodeURIComponent(String(p.id));
    
productsContainer.innerHTML += `
<div class="product-link" data-product-id="${productId}" onclick="openProductFromElement(this)">

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

      <br><br>
<button onclick="addToCartFromButton(event, this)" ${!p.stock ? "disabled" : ""}>
  ${p.stock ? "Ajouter au panier" : "Indisponible"}
</button>

    </div>

  </div>

</div>
`;
  });
}

/* =========================
   PANIER
========================= */

let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let pdfDownloaded = false;

function getProductIdFromElement(element) {
  const productElement = element.closest("[data-product-id]");
  return productElement ? decodeURIComponent(productElement.dataset.productId) : "";
}

function openProductFromElement(element) {
  openProduct(getProductIdFromElement(element));
}

function addToCartFromButton(event, button) {
  addToCart(event, getProductIdFromElement(button));
}

function openProduct(id) {
  window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}

function addToCart(event, id) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const product = products.find(p => String(p.id) === String(id));

  if (!product) return;

  if (!product.stock) {
    alert("Produit indisponible");
    return;
  }

  const existing = cart.find(item => item.id === product.id);
  const available = Number(product.quantity);

  if (Number.isFinite(available)) {
    const currentQuantity = existing ? existing.quantity || 1 : 0;

    if (currentQuantity >= available) {
      alert("Stock insuffisant");
      return;
    }
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function removeFromCart(index) {

  cart.splice(index, 1);

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  renderCart();
}


function increaseQuantity(index) {
  const item = cart[index];
  const product = products.find(p => String(p.id) === String(item?.id));
  const available = Number(product?.quantity);

  if (Number.isFinite(available) && item.quantity >= available) {
    alert("Stock insuffisant");
    return;
  }

  cart[index].quantity++;

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  renderCart();
}

function decreaseQuantity(index) {

  if (cart[index].quantity > 1) {

    cart[index].quantity--;

  } else {

    cart.splice(index, 1);

  }

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  renderCart();
}

function renderCart() {

  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");

  if (!cartItems || !cartTotal) return;

  cartItems.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {

    const quantity = item.quantity || 1;
    const img = (item.images && item.images[0]) || item.img || "";

    total += Number(item.price) * quantity;

    cartItems.innerHTML += `
      <div class="cart-item">

        <img src="${img}" alt="${item.name}">

        <div class="cart-details">

          <strong>${item.name}</strong>

          <p>${item.price} DH</p>

          <div class="quantity-controls">

            <button class="qty-btn" onclick="decreaseQuantity(${index})" aria-label="Diminuer la quantite">
              -
            </button>

            <span>${quantity}</span>

            <button class="qty-btn" onclick="increaseQuantity(${index})" aria-label="Augmenter la quantite">
              +
            </button>

          </div>

        </div>

        <button class="remove-btn" onclick="removeFromCart(${index})" aria-label="Retirer du panier">
          x
        </button>

      </div>
    `;
  });

  cartTotal.textContent = total + " DH";
}

/* =========================
   CHECKOUT
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
   INITIALISATION
========================= */

window.addEventListener("DOMContentLoaded", async () => {

  await loadProducts();
  renderCart();

  const params = new URLSearchParams(window.location.search);

  if (params.get("page") === "products") {
    showPage("products");
  } else {
    showPage("home");
  }

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

    localStorage.removeItem("cart");
    cart = [];
    renderCart();

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
window.showPage = showPage;
window.checkout = checkout;
window.closeCheckout = closeCheckout;
window.closeSuccess = closeSuccess;
window.downloadOrder = downloadOrder;
window.addToCartFromButton = addToCartFromButton;
window.openProductFromElement = openProductFromElement;
window.openProduct = openProduct;
window.addToCart = addToCart;
window.renderCart = renderCart;
window.goToImg = window.goToImg;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeFromCart = removeFromCart;

console.log("Fonctions Virethos exposées");