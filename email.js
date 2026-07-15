emailjs.init("JuTEKVA1eXAEsOmMP");


function sendOrderEmail() {

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

    orderText +=
    `${item.name} x${item.quantity} = ${price} DH\n`;

  });


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