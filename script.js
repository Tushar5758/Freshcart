function openAddProductModal() {
    var addModal = new bootstrap.Modal(document.getElementById("addProductModal"));
    addModal.show();
}

function addProduct() {
    const name = document.getElementById("name").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;
    const unit = document.getElementById("unit").value;  // ✅ Unit selected from dropdown
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

// ✅ Fetch Inventory
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

// ✅ Fetch Bills
function fetchBills() {
    fetch("http://localhost:3000/getBills")
    .then(res => res.json())
    .then(data => {
        let table = document.getElementById("billsTable");
        table.innerHTML = "";
        data.forEach(bill => {
            table.innerHTML += `
                <tr>
                    <td>${bill.id}</td>
                    <td>${bill.date}</td>
                    <td>${bill.total_amount}</td>
                </tr>
            `;
        });
    });
}

window.onload = function() {
    fetchInventory();
    fetchBills();
};
