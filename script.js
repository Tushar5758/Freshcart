function openAddProductModal() {
    var addModal = new bootstrap.Modal(document.getElementById("addProductModal"));
    addModal.show();
}

function addProduct() {
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;
    const unit = document.getElementById("unit").value;
    const category = document.getElementById("category").value;

    fetch("http://localhost:3000/addProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, stock, unit, category })
    }).then(() => {
        fetchInventory();
        document.querySelector("#addProductModal .btn-secondary").click();
    });
}

function fetchInventory() {
    fetch("http://localhost:3000/getInventory")
    .then(res => res.json())
    .then(data => {
        let table = document.getElementById("inventoryTable");
        table.innerHTML = "";
        data.forEach(item => {
            table.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.price}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td>${item.category}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="openUpdateModal(${item.id}, '${item.name}', ${item.price}, ${item.stock}, '${item.unit}', '${item.category}')">Update</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${item.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    });
}

function openUpdateModal(id, name, price, stock, unit, category) {
    document.getElementById("updateId").value = id;
    document.getElementById("updateName").value = name;
    document.getElementById("updatePrice").value = price;
    document.getElementById("updateStock").value = stock;
    document.getElementById("updateUnit").value = unit;
    document.getElementById("updateCategory").value = category;

    var updateModal = new bootstrap.Modal(document.getElementById("updateProductModal"));
    updateModal.show();
}

function updateProduct() {
    const id = document.getElementById("updateId").value;
    const name = document.getElementById("updateName").value;
    const price = document.getElementById("updatePrice").value;
    const stock = document.getElementById("updateStock").value;
    const unit = document.getElementById("updateUnit").value;
    const category = document.getElementById("updateCategory").value;

    fetch(`http://localhost:3000/updateProduct/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, stock, unit, category })
    }).then(() => {
        fetchInventory();
        document.querySelector("#updateProductModal .btn-secondary").click();
    });
}

function deleteProduct(id) {
    fetch(`http://localhost:3000/deleteProduct/${id}`, {
        method: "DELETE"
    }).then(() => {
        fetchInventory();
    });
}

window.onload = function() {
    fetchInventory();
    fetchBills();
};
let searchForm = document.querySelector('.search-form');

document.querySelector('#search-btn').onclick = () =>
{
    searchForm.classList.toggle('active');
    navbar.classList.remove('active');
}

let navbar = document.querySelector('.navbar');

document.querySelector('#menu-btn').onclick = () =>
{
    navbar.classList.toggle('active');
    searchForm.classList.remove('active');
}

window.onscroll = () =>
{
    searchForm.classList.remove('active');
    navbar.classList.remove('active');
}



var swiper = new Swiper(".product-slider", {
    loop:true,
    spaceBetween: 20,

    autoplay: {
        delay: 7500,
        disableOnInteraction: false,
    },

    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
        
      },
    },
  });