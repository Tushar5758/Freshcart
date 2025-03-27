function openAddProductModal() {
    var addModal = new bootstrap.Modal(document.getElementById("addProductModal"));
    document.getElementById("name").value = '';
    document.getElementById("price").value = '';
    document.getElementById("stock").value = '';
    document.getElementById("unit").value = 'kg';
    document.getElementById("category").value = '';
    document.getElementById("productImage").value = '';
    addModal.show();
}

function addProduct() {
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;
    const unit = document.getElementById("unit").value;
    const category = document.getElementById("category").value;
    const imageInput = document.getElementById("productImage");
    const image = imageInput.files.length > 0 ? imageInput.files[0] : null;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("unit", unit);
    formData.append("category", category);
    if (image) formData.append("image", image);

    fetch("http://localhost:3000/addProduct", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(() => {
        fetchInventory();
        document.getElementById("addProductModal").querySelector(".btn-close").click();
    })
    .catch(error => console.error("Error adding product:", error));
}

// Add the update modal and functionality
function openUpdateModal(id, name, price, stock, unit, category, image) {
    // Create update modal if it doesn't exist
    if (!document.getElementById("updateProductModal")) {
        const modalHTML = `
        <div class="modal fade" id="updateProductModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Update Product</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="updateId">
                        <input type="hidden" id="currentImage">
                        <input type="text" id="updateName" placeholder="Name" class="form-control mb-2">
                        <input type="number" id="updatePrice" placeholder="Price" class="form-control mb-2">
                        <input type="number" id="updateStock" placeholder="Stock" class="form-control mb-2">
                        <select id="updateUnit" class="form-control mb-2">
                            <option value="kg">kg</option>
                            <option value="litre">litre</option>
                            <option value="pieces">pieces</option>
                        </select>
                        <select id="updateCategory" class="form-control mb-2">
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fresh Fruits">Fresh Fruits</option>
                        <option value="Dairy Products">Dairy Products</option>
                        <option value="Fresh Meat">Fresh Meat</option>
                       </select>
                        <div class="mb-2">
                            <img id="currentImagePreview" width="100" class="mb-2">
                        </div>
                        <input type="file" id="updateProductImage" class="form-control mb-2">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button class="btn btn-warning" onclick="updateProduct()">Update</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Set values in update modal
    document.getElementById("updateId").value = id;
    document.getElementById("updateName").value = name;
    document.getElementById("updatePrice").value = price;
    document.getElementById("updateStock").value = stock;
    document.getElementById("updateUnit").value = unit;
    document.getElementById("updateCategory").value = category;
    document.getElementById("currentImage").value = image;
    
    if (image && image !== 'null') {
        document.getElementById("currentImagePreview").src = image;
        document.getElementById("currentImagePreview").style.display = "block";
    } else {
        document.getElementById("currentImagePreview").style.display = "none";
    }

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
    const currentImage = document.getElementById("currentImage").value;
    const imageInput = document.getElementById("updateProductImage");
    const image = imageInput.files.length > 0 ? imageInput.files[0] : null;

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("unit", unit);
    formData.append("category", category);
    formData.append("currentImage", currentImage);
    if (image) formData.append("image", image);

    fetch(`http://localhost:3000/updateProduct/${id}`, {
        method: "PUT",
        body: formData
    })
    .then(response => response.json())
    .then(() => {
        fetchInventory();
        document.getElementById("updateProductModal").querySelector(".btn-close").click();
    })
    .catch(error => console.error("Error updating product:", error));
}

function deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
        fetch(`http://localhost:3000/deleteProduct/${id}`, {
            method: "DELETE"
        })
        .then(response => response.json())
        .then(() => fetchInventory())
        .catch(error => console.error("Error deleting product:", error));
    }
}

function fetchInventory() {
    fetch("http://localhost:3000/getInventory")
    .then(res => res.json())
    .then(data => {
        let table = document.getElementById("inventoryTable");
        table.innerHTML = "";
        data.forEach(item => {
            const imageSrc = item.image ? item.image : 'https://via.placeholder.com/50';
            table.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.price}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td>${item.category}</td>
                    <td><img src="${imageSrc}" width="50" height="50" class="img-thumbnail"></td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="openUpdateModal(${item.id}, '${item.name}', ${item.price}, ${item.stock}, '${item.unit}', '${item.category}','${item.image}')">Update</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${item.id})">Delete</button>
                    </td>
                </tr>`;
        });
    })
    .catch(error => console.error("Error fetching inventory:", error));
}

window.onload = function() {
    fetchInventory();
    if (typeof fetchBills === "function") fetchBills();
};

// Navigation handlers for search and menu buttons if they exist
let searchForm = document.querySelector('.search-form');
let navbar = document.querySelector('.navbar');

if (document.querySelector('#search-btn')) {
    document.querySelector('#search-btn').onclick = () => {
        searchForm.classList.toggle('active');
        navbar.classList.remove('active');
    }
}

if (document.querySelector('#menu-btn')) {
    document.querySelector('#menu-btn').onclick = () => {
        navbar.classList.toggle('active');
        searchForm.classList.remove('active');
    }
}

window.onscroll = () => {
    if (searchForm) searchForm.classList.remove('active');
    if (navbar) navbar.classList.remove('active');
}

// Only initialize swiper if it exists
if (typeof Swiper !== 'undefined' && document.querySelector(".product-slider")) {
    var swiper = new Swiper(".product-slider", {
        loop: true,
        spaceBetween: 20,
        autoplay: {
            delay: 7500,
            disableOnInteraction: false,
        },
        breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
        },
    });
}