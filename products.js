// Add this function to check if user is logged in
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function viewProductDetails(itemId) {
    // Navigate to the product detail page with the product ID as a parameter
    window.location.href = `product.html?id=${itemId}`;
}

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
                    <img src="${imageSrc}" class="img-thumbnail" onclick="viewProductDetails(${item.id})" style="cursor: pointer;">
                    <h1 onclick="viewProductDetails(${item.id})" style="cursor: pointer;">${item.name}</h1>
                    <div class="price">$${item.price.toFixed(2)}/- per ${item.unit || 'unit'}</div>
                    <div class="stars">
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star-half-o"></i>
                    </div>
                    <div class="stock">${item.stock || 'In Stock'} available</div>
                    <a href="#" class="btn" onclick="addToCart(${item.id})">
                        <i class="fa fa-shopping-cart"></i> add to cart
                    </a>
                </div>`;
        });
        
        secondHalf.forEach(item => {
            const imageSrc = item.image ? `http://localhost:3000/image/${item.id}` : 'https://via.placeholder.com/50';
            productSlider2.innerHTML += `
                <div class="swiper-slide box">
                    <img src="${imageSrc}" class="img-thumbnail" onclick="viewProductDetails(${item.id})" style="cursor: pointer;">
                    <h1 onclick="viewProductDetails(${item.id})" style="cursor: pointer;">${item.name}</h1>
                    <div class="price">$${item.price.toFixed(2)}/- per ${item.unit || 'unit'}</div>
                    <div class="stars">
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star"></i>
                        <i class="fa fa-star-half-o"></i>
                    </div>
                    <div class="stock">${item.stock || 'In Stock'} available</div>
                    <a href="#" class="btn" onclick="addToCart(${item.id})">
                        <i class="fa fa-shopping-cart"></i> add to cart
                    </a>
                </div>`;
        });
        
        // Initialize Swiper instances separately
        initializeSwipers();
    })
    .catch(error => console.error("Error fetching inventory:", error));
}

function initializeSwipers() {
    // Create separate Swiper instances for each slider with identical settings
    const swiperOptions = {
        loop: true,
        spaceBetween: 20,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        centeredSlides: true,
        effect: 'slide',  // Using the same slide effect for both sliders
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1020: {
                slidesPerView: 3,
            },
        },
    };
    
    // Initialize first slider
    new Swiper(".product-slider-1", {
        ...swiperOptions,
        navigation: {
            nextEl: '.swiper-button-next-1',
            prevEl: '.swiper-button-prev-1',
        },
        pagination: {
            el: '.swiper-pagination-1',
            clickable: true,
        }
    });

    // Initialize second slider with the same settings
    new Swiper(".product-slider-2", {
        ...swiperOptions,
        navigation: {
            nextEl: '.swiper-button-next-2',
            prevEl: '.swiper-button-prev-2',
        },
        pagination: {
            el: '.swiper-pagination-2',
            clickable: true,
        }
    });
}

// Function to handle "Add to Cart" action
function addToCart(itemId) {
    // Check if user is logged in
    if (!isUserLoggedIn()) {
        // Redirect to login page
        alert('Please login to add items to cart');
        window.location.href = 'login.html';
        return;
    }

    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Fetch the product details and add to cart
    fetch(`http://localhost:3000/getProduct/${itemId}`)
    .then(res => res.json())
    .then(product => {
        // Check if product already exists in cart
        let existingProductIndex = cart.findIndex(item => item.id === product.id);
        if (existingProductIndex > -1) {
            // If product exists, increase quantity
            cart[existingProductIndex].quantity += 1;
        } else {
            // If product is new, add to cart with quantity 1
            cart.push({
                ...product,
                quantity: 1
            });
        }

        // Save updated cart to localStorage
        localStorage.setItem("cart", JSON.stringify(cart));

        // Add animation to the cart icon
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.classList.add('pulse-animation');
            setTimeout(() => {
                cartBtn.classList.remove('pulse-animation');
            }, 1000);
        }

        // Show alert that product was added
        alert(`${product.name} added to cart!`);
    })
    .catch(error => {
        console.error("Error fetching product details:", error);
        alert("Failed to add product to cart");
    });
}

// Animation for product boxes on hover
document.addEventListener('DOMContentLoaded', function() {
    fetchInventory();
    
    // Add hover effects to product boxes dynamically
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.swiper-slide.box')) {
            const box = e.target.closest('.swiper-slide.box');
            box.style.transform = 'translateY(-10px)';
            box.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
            box.style.transition = 'all 0.3s ease';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.swiper-slide.box')) {
            const box = e.target.closest('.swiper-slide.box');
            box.style.transform = 'translateY(0)';
            box.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.1)';
        }
    });
});