// Define the base URL for API and resource endpoints
const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://yourproductionserver.com';

// Function to check if user is logged in
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function viewProductDetails(itemId) {
    // Navigate to the product detail page with the product ID as a parameter
    window.location.href = `product.html?id=${itemId}`;
}

function fetchInventory() {
    fetch(`${baseUrl}/getInventory`)
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
            const imageSrc = item.image ? `${baseUrl}/image/${item.id}` : 'https://via.placeholder.com/50';
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
                    <a href="#" class="btn" onclick="viewProductDetails(${item.id})">
                        <i class="fa fa-shopping-cart"></i> add to cart
                    </a>
                </div>`;
        });
        
        secondHalf.forEach(item => {
            const imageSrc = item.image ? `${baseUrl}/image/${item.id}` : 'https://via.placeholder.com/50';
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
                    <a href="#" class="btn" onclick="viewProductDetails(${item.id})">
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

// Function to create product cards with proper button behavior
function createProductCard(product, containerId) {
    const productElement = document.createElement('div');
    productElement.className = 'swiper-slide box';
    
    // Create the product card content with modified add to cart button
    productElement.innerHTML = `
      <img src="${product.image}" alt="${product.name}" onclick="viewProductDetails('${product.id}')" style="cursor: pointer;">
      <h1 onclick="viewProductDetails('${product.id}')" style="cursor: pointer;">${product.name}</h1>
      <div class="price">$${product.price.toFixed(2)}</div>
      <div class="stars">
        ${generateStars(product.rating)}
      </div>
      <div class="stock">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</div>
      <a href="#" class="btn" onclick="viewProductDetails('${product.id}')">
        <i class="fa fa-shopping-cart"></i> add to cart
      </a>
    `;
    
    // Add the product to the container
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(productElement);
    }
}
  
// Helper function to generate star ratings
function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fa fa-star"></i>';
    }
    
    if (hasHalfStar) {
      stars += '<i class="fa fa-star-half-o"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="fa fa-star-o"></i>';
    }
    
    return stars;
}
  
// Initialize product sliders with the correct behavior
document.addEventListener('DOMContentLoaded', function() {
    const productSlider1 = new Swiper('.product-slider-1', {
      loop: true,
      spaceBetween: 20,
      autoplay: {
        delay: 7500,
        disableOnInteraction: false,
      },
      centeredSlides: true,
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
      pagination: {
        el: '.swiper-pagination-1',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next-1',
        prevEl: '.swiper-button-prev-1',
      },
    });
    
    const productSlider2 = new Swiper('.product-slider-2', {
      loop: true,
      spaceBetween: 20,
      autoplay: {
        delay: 7500,
        disableOnInteraction: false,
      },
      centeredSlides: true,
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
      pagination: {
        el: '.swiper-pagination-2',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next-2',
        prevEl: '.swiper-button-prev-2',
      },
    });
});

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
