import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let products = [];
let orders = [];

/* ================= DOM ================= */
const form = document.getElementById("productForm");
const imagesInput = document.getElementById("images");
const preview = document.getElementById("preview");
const list = document.getElementById("list");

const addPage = document.getElementById("addPage");
const productsPage = document.getElementById("productsPage");

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

  render();
}

async function loadOrders(){

  const snapshot = await getDocs(
    collection(db,"orders")
  );

  orders = [];

  snapshot.forEach(item => {

    orders.push({
      id:item.id,
      ...item.data()
    });

  });

}

/* ================= SIDEBAR ================= */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

/* ================= NAV ================= */
function showAdd() {
  addPage.style.display = "block";
  productsPage.style.display = "none";
}

function showProducts() {
  addPage.style.display = "none";
  productsPage.style.display = "block";
  render();
}

/* ================= PREVIEW IMAGES ================= */
imagesInput.addEventListener("change", () => {
  preview.innerHTML = "";

  Array.from(imagesInput.files).forEach(file => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.width = "70px";
      img.style.margin = "5px";
      img.style.borderRadius = "6px";
      preview.appendChild(img);
    };

    reader.readAsDataURL(file);
  });
});

/* ================= ADD PRODUCT ================= */
form.addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const price = Number(document.getElementById("price").value);
  const quantity = Math.max(0, Number(document.getElementById("quantity").value) || 0);
  const stock = quantity > 0;

  const files = imagesInput.files;
  if (!files.length) return;

  let images = [];
  let loaded = 0;

  for (let file of files) {
    const reader = new FileReader();

    reader.onload = async e => {
      images.push(e.target.result);
      loaded++;

      if (loaded === files.length) {

        const product = {
         name,
         price,
         images,
         quantity,
         stock,
         discount: 0
     };


      await addDoc(
       collection(db, "products"),
       product
      );


await loadProducts();

        form.reset();
        preview.innerHTML = "";
      }
    };

    reader.readAsDataURL(file);
  }
});

/* ================= RENDER PRODUCTS (SHOP STYLE) ================= */
function getOrderedQuantity(productId){

  let total = 0;


  orders.forEach(order => {

    const items = Array.isArray(order.items)
      ? order.items
      : [];


    items.forEach(item => {

      if(String(item.id) === String(productId)){

        total += Number(item.quantity) || 1;

      }

    });

  });


  return total;

}

function render() {
  list.innerHTML = products.map(p => {

    let finalPrice = p.discount > 0
      ? p.price - (p.price * p.discount / 100)
      : p.price;
    const quantity = Number(p.quantity) || 0;
    const stock = quantity > 0;
    const orderedQuantity = getOrderedQuantity(p.id);

    return `
      <div class="product-card" style="
        width:260px;
        background:#11131a;
        border:1px solid #333;
        border-radius:12px;
        overflow:hidden;
        margin:10px;
        display:inline-block;
        vertical-align:top;
      ">

        <img src="${p.images[0]}" style="width:100%;height:220px;object-fit:cover;">

        <div style="padding:10px;text-align:center;">

          <h3>${p.name}</h3>

          <p style="color:#7a1f1f;font-weight:bold;">
            ${p.price} DH
          </p>

          <input type="number" value="${p.price}"
            onchange="updatePrice('${p.id}', this.value)"
            style="width:80px;">

          <br><br>

          <input type="number" value="${p.discount}"
            placeholder="Réduction %"
            onchange="updateDiscount('${p.id}', this.value)"
            style="width:80px;">

          <p>Final: ${finalPrice.toFixed(2)} DH</p>

          <p style="color:${stock ? 'green':'red'}">
            ${stock ? "En stock" : "Rupture"}
          </p>

          <p style="color:#c7ccd6;font-weight:bold;">
            Quantite restante: ${quantity}
          </p>

          <p style="color:#6F7680;">
            Commandes: ${orderedQuantity}
          </p>

          <input type="number" min="0" value="${quantity}"
            onchange="updateQuantity('${p.id}', this.value)"
            style="width:90px;">

          <br><br>

          <label>
            <input type="checkbox" ${stock ? "checked" : ""}
              onchange="toggleStock('${p.id}')">
            Stock
          </label>

          <br><br>

          <button onclick="editImages('${p.id}')">Images</button>
          <button onclick="deleteProduct('${p.id}')">Delete</button>

        </div>
      </div>
    `;
  }).join("");
}

/* ================= UPDATE ================= */
async function updatePrice(id, value) {

  const price = Number(value);

  await updateDoc(
    doc(db, "products", id),
    {
      price
    }
  );

  await loadProducts();
}

async function updateDiscount(id, value) {

  const discount = Number(value);

  await updateDoc(
    doc(db, "products", id),
    {
      discount
    }
  );

  await loadProducts();
}

async function updateQuantity(id, value) {

  const quantity = Math.max(0, Number(value) || 0);

  await updateDoc(
    doc(db, "products", id),
    {
      quantity,
      stock: quantity > 0
    }
  );

  await loadProducts();
}

async function toggleStock(id) {

  const product = products.find(
    p => p.id === id
  );

  if (!product) return;


  const stock = !product.stock;

  const quantity = stock
    ? Math.max(1, Number(product.quantity) || 1)
    : 0;


  await updateDoc(
    doc(db, "products", id),
    {
      stock,
      quantity
    }
  );


  await loadProducts();
}

async function deleteProduct(id) {

  await deleteDoc(
    doc(db, "products", id)
  );


  await loadProducts();
}

/* ================= EDIT IMAGES ================= */
function editImages(id) {
  const product = products.find(p => p.id === id);

  const modal = document.createElement("div");
  modal.style = `
    position:fixed;
    top:0;left:0;
    width:100%;height:100%;
    background:#000000cc;
    display:flex;
    justify-content:center;
    align-items:center;
  `;

  modal.innerHTML = `
    <div style="background:#11131a;padding:20px;width:350px;border-radius:10px;">
      <h3>Modifier images</h3>
      <div id="imgBox"></div>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;

  document.body.appendChild(modal);

  renderImages(product, modal);
}

/* ================= IMAGE EDITOR ================= */
function renderImages(product, modal) {
  const box = modal.querySelector("#imgBox");

  function draw() {
    box.innerHTML = "";

    product.images.forEach((img, index) => {

      const div = document.createElement("div");
      div.style = "display:flex;gap:10px;align-items:center;margin:5px;";

      div.innerHTML = `
        <img src="${img}" width="50" height="50" style="object-fit:cover;border-radius:6px;">

        <button onclick="moveUp('${product.id}', ${index})">⬆</button>
        <button onclick="moveDown('${product.id}', ${index})">⬇</button>
        <button onclick="removeImage('${product.id}', ${index})">❌</button>
      `;

      box.appendChild(div);
    });
  }

  draw();
}

/* ================= IMAGE ACTIONS ================= */
function moveUp(id, index) {
  let p = products.find(p => p.id === id);
  if (index === 0) return;

  [p.images[index], p.images[index-1]] =
  [p.images[index-1], p.images[index]];

  save();
  render();
}

function moveDown(id, index) {
  let p = products.find(p => p.id === id);
  if (index === p.images.length - 1) return;

  [p.images[index], p.images[index+1]] =
  [p.images[index+1], p.images[index]];

  save();
  render();
}

function removeImage(id, index) {
  let p = products.find(p => p.id === id);

  p.images.splice(index, 1);

  save();
  render();
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("active");
}

/* expose */
window.toggleSidebar = toggleSidebar;
window.showAdd = showAdd;
window.showProducts = showProducts;
window.closeSidebar = closeSidebar;
window.updatePrice = updatePrice;
window.updateDiscount = updateDiscount;
window.updateQuantity = updateQuantity;
window.toggleStock = toggleStock;
window.deleteProduct = deleteProduct;
window.editImages = editImages;
window.moveUp = moveUp;
window.moveDown = moveDown;
window.removeImage = removeImage;
window.loadProducts = loadProducts;
window.addEventListener("DOMContentLoaded", async () => {
  await loadOrders();
  await loadProducts();
});