function fetchInventory() {
    fetch("http://localhost:3000/getInventory")
    .then(res => res.json())
    .then(data => {
        let productSlider1 = document.getElementById("product-slider-1");
        let productSlider2 = document.getElementById("product-slider-2");
        
        if (!productSlider1 || !productSlider2) {
            console.error("Product slider elements not found!");
            return;
        }

        productSlider1.innerHTML = "";
        productSlider2.innerHTML = "";
        
        const halfLength = Math.ceil(data.length / 2);
        const firstHalf = data.slice(0, halfLength);
        const secondHalf = data.slice(halfLength);
        
        firstHalf.forEach(item => {
            const imageSrc = item.image ? `http://localhost:3000/image/${item.id}` : 'https://via.placeholder.com/50';
            productSlider1.innerHTML += `
                <div class="swiper-slide box">
                    <img src="${imageSrc}" class="img-thumbnail">
                    <h1>${item.name}</h1>
                    <div class="price">$${item.price.toFixed(2)}/- per ${item.unit || 'unit'}</div>
                    <div class="stock">${item.stock || 'In Stock'} available</div>
                    <a href="#" class="btn" onclick="addToCart(${item.id})">add to cart</a>
                </div>`;
        });
        
        secondHalf.forEach(item => {
            const imageSrc = item.image ? `http://localhost:3000/image/${item.id}` : 'https://via.placeholder.com/50';
            productSlider2.innerHTML += `
                <div class="swiper-slide box">
                    <img src="${imageSrc}" class="img-thumbnail">
                    <h1>${item.name}</h1>
                    <div class="price">$${item.price.toFixed(2)}/- per ${item.unit || 'unit'}</div>
                    <div class="stock">${item.stock || 'In Stock'} available</div>
                    <a href="#" class="btn" onclick="addToCart(${item.id})">add to cart</a>
                </div>`;
        });
    })
    .catch(error => console.error("Error fetching inventory:", error));
}
