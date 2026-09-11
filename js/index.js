/* =========================================================
   YAMZZ MARKET
   INDEX.JS
   JSONBIN SINGLE DATABASE
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {

    // ID JSONBin kamu
    BIN_ID: "6a97221eda38895dfe2c57b6",

    // JSONBin Access Key untuk READ
    ACCESS_KEY: "$2a$10$XkuvGHYPmOrDazsHVKoqU.0bp.DPZQuLg8.vDg7RYec1WaXBZiSE6",

    // API JSONBin
    API_URL: "https://api.jsonbin.io/v3/b",

    // Halaman pembayaran
    PAYMENT_PAGE: "payment.html",

    // Nama default jika database gagal
    DEFAULT_NAME: "Yamzz Market"

};


/* =========================================================
   GLOBAL DATA
========================================================= */

let DB = {

    site: {
        name: "Yamzz Market",
        title: "JASTEB",
        description:
            "Tempat jual beli JASTEB dengan proses cepat, aman dan terpercaya.",
        tagline: "JASTEB TERPERCAYA",

        logo: "",
        banner: "",

        whatsapp: "",
        email: "",

        qris: "",

        socials: {
            tiktok: "",
            instagram: "",
            youtube: "",
            telegram: ""
        },

        cloudinaryCloudName: "",
        cloudinaryUploadPreset: ""
    },

    products: [],

    orders: []

};


let currentCategory = "all";
let selectedProduct = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setupFooterYear();

    setupCategoryButtons();

    setupModal();

    setupNavigation();
    setupProductSearch();
    setupGuides();

    await loadDatabase();

});


/* =========================================================
   LOAD DATABASE
========================================================= */

async function loadDatabase() {

    showLoader();

    try {

        const data = await getDatabase();

        DB = normalizeDatabase(data);

        renderStore();
        renderHomeDashboard();
        renderProducts();
        renderSystemStatus();

        hideLoader();

    } catch (error) {

        console.error("Gagal memuat database:", error);

        DB = normalizeDatabase({});

        renderStore();
        renderHomeDashboard();
        renderProducts();
        renderSystemStatus();

        showToast(
            "Gagal Memuat",
            "Database tidak dapat dimuat."
        );

        hideLoader();

    }

}


/* =========================================================
   GET JSONBIN
========================================================= */

async function getDatabase() {

    if (
        !CONFIG.BIN_ID ||
        CONFIG.BIN_ID.includes("GANTI_")
    ) {

        throw new Error(
            "BIN_ID JSONBin belum dikonfigurasi."
        );

    }


    if (
        !CONFIG.ACCESS_KEY ||
        CONFIG.ACCESS_KEY.includes("GANTI_")
    ) {

        throw new Error(
            "ACCESS_KEY JSONBin belum dikonfigurasi."
        );

    }


    const response = await fetch(
        `${CONFIG.API_URL}/${CONFIG.BIN_ID}/latest`,
        {
            method: "GET",

            headers: {
                "X-Access-Key": CONFIG.ACCESS_KEY
            },

            cache: "no-store"
        }
    );


    if (!response.ok) {

        throw new Error(
            `JSONBin Error ${response.status}`
        );

    }


    const result = await response.json();


    /*
     * JSONBin biasanya:
     *
     * {
     *   record: {...},
     *   metadata: {...}
     * }
     */

    return result.record || {};

}


/* =========================================================
   NORMALIZE DATABASE
========================================================= */

function normalizeDatabase(data) {

    data = data || {};


    const site = data.site || {};

    const socials = site.socials || {};


    return {

        site: {

            name:
                site.name ||
                CONFIG.DEFAULT_NAME,

            title:
                site.title ||
                "JASTEB",

            description:
                site.description ||
                "Tempat jual beli JASTEB dengan proses cepat, aman dan terpercaya.",

            tagline:
                site.tagline ||
                "JASTEB TERPERCAYA",


            logo:
                site.logo ||
                "",

            banner:
                site.banner ||
                "",

            notification:
                site.notification ||
                "",

            maintenance:
                site.maintenance === true,

            storeOffline:
                site.storeOffline === true,


            whatsapp:
                site.whatsapp ||
                "",

            email:
                site.email ||
                "",

            whatsappChannel:
                site.whatsappChannel ||
                site.waChannel ||
                "",


            qris:
                site.qris ||
                "",


            socials: {

                tiktok:
                    socials.tiktok ||
                    "",

                instagram:
                    socials.instagram ||
                    "",

                youtube:
                    socials.youtube ||
                    "",

                telegram:
                    socials.telegram ||
                    ""

            },


            cloudinaryCloudName:
                site.cloudinaryCloudName ||
                "",

            cloudinaryUploadPreset:
                site.cloudinaryUploadPreset ||
                ""

        },


        products:
            Array.isArray(data.products)
                ? data.products
                : [],


        orders:
            Array.isArray(data.orders)
                ? data.orders
                : []

    };

}


/* =========================================================
   RENDER STORE
========================================================= */

function renderStore() {

    const site = DB.site;


    /* -----------------------------------------
       STORE NAME
    ----------------------------------------- */

    setText(
        "navStoreName",
        site.name
    );


    setText(
        "footerStoreName",
        site.name
    );


    setText(
        "copyrightName",
        site.name
    );


    /* -----------------------------------------
       HERO
    ----------------------------------------- */

    setText(
        "heroTagline",
        site.tagline
    );


    const heroTitle =
        document.getElementById("heroTitle");

    if (heroTitle) {

        heroTitle.innerHTML = `
            ${escapeHTML(site.title)}
            <span>${escapeHTML(site.name)}</span>
        `;

    }


    setText(
        "heroDescription",
        site.description
    );


    /* -----------------------------------------
       ABOUT
    ----------------------------------------- */

    setText(
        "aboutTitle",
        `Tentang ${site.name}`
    );


    setText(
        "aboutDescription",
        site.description
    );


    /* -----------------------------------------
       FOOTER
    ----------------------------------------- */

    setText(
        "footerDescription",
        site.description
    );


    /* -----------------------------------------
       LOGO
    ----------------------------------------- */

    setImage(
        "navLogo",
        site.logo,
        `${site.name} Logo`
    );


    setImage(
        "heroLogo",
        site.logo,
        `${site.name} Logo`
    );


    setImage(
        "footerLogo",
        site.logo,
        `${site.name} Logo`
    );


    /* -----------------------------------------
       BANNER
    ----------------------------------------- */

    setImage(
        "storeBanner",
        site.banner,
        `${site.name} Banner`
    );


    setText(
        "bannerTitle",
        site.title || "JASTEB TERBARU"
    );


    setText(
        "bannerDescription",
        site.description
    );


    /* -----------------------------------------
       WHATSAPP
    ----------------------------------------- */

    setupWhatsApp(
        site.whatsapp
    );


    /* -----------------------------------------
       EMAIL
    ----------------------------------------- */

    setupEmail(
        site.email
    );


    /* -----------------------------------------
       SOCIAL MEDIA
    ----------------------------------------- */

    setupSocial(
        "socialTiktok",
        site.socials.tiktok
    );


    setupSocial(
        "socialInstagram",
        site.socials.instagram
    );


    setupSocial(
        "socialYoutube",
        site.socials.youtube
    );


    setupSocial(
        "socialTelegram",
        site.socials.telegram
    );


    /* -----------------------------------------
       PRODUCT COUNT
    ----------------------------------------- */

    updateProductCount();
    renderAboutContact();

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    const container =
        document.getElementById(
            "productsContainer"
        );


    const emptyState =
        document.getElementById(
            "emptyProducts"
        );


    if (!container) {
        return;
    }


    let products = [...DB.products];


    /* -----------------------------------------
       FILTER CATEGORY
    ----------------------------------------- */

    if (currentCategory !== "all") {

        products =
            products.filter(product => {

                const category =
                    normalizeCategory(
                        product.category
                    );

                return category ===
                    currentCategory;

            });

    }


    /* -----------------------------------------
       CLEAR CONTAINER
    ----------------------------------------- */

    container.innerHTML = "";


    /* -----------------------------------------
       EMPTY
    ----------------------------------------- */

    if (!products.length) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;

    }


    if (emptyState) {
        emptyState.style.display = "none";
    }


    /* -----------------------------------------
       RENDER
    ----------------------------------------- */

    products.forEach(
        (product, index) => {

            container.appendChild(
                createProductCard(
                    product,
                    index
                )
            );

        }
    );

}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createProductCard(product, index) {

    const card =
        document.createElement("div");


    card.className =
        "product-card";


    const name =
        product.name ||
        "Produk";


    const description =
        product.description ||
        "Produk JASTEB";


    const price =
        Number(product.price) || 0;


    const image =
        product.image ||
        product.img ||
        "";


    const category =
        normalizeCategory(
            product.category
        );


    const categoryName =
        getCategoryName(
            category
        );


    const stock =
        getStock(product);


    const isOutOfStock =
        stock <= 0;


    if (isOutOfStock) {

        card.classList.add(
            "out-of-stock"
        );

    }


    card.innerHTML = `

        <div class="product-image">

            ${
                image
                ?
                `
                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(name)}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >
                `
                :
                `
                <div class="product-image-placeholder">
                    <span class="material-symbols-rounded">inventory_2</span>
                </div>
                `
            }

            <span class="product-badge">
                ${escapeHTML(categoryName)}
            </span>

        </div>


        <div class="product-body">

            <span class="product-category">
                ${escapeHTML(categoryName)}
            </span>


            <h3 class="product-name">
                ${escapeHTML(name)}
            </h3>


            <p class="product-description">
                ${escapeHTML(description)}
            </p>


            <div class="product-bottom">

                <div class="product-price">

                    <span>
                        Mulai dari
                    </span>

                    <strong>
                        ${formatRupiah(price)}
                    </strong>

                </div>


                <div class="product-stock">

                    ${
                        isOutOfStock
                        ?
                        `
                        <span class="material-symbols-rounded">cancel</span>
                        Habis
                        `
                        :
                        `
                        <span class="material-symbols-rounded">check_circle</span>
                        ${stock} tersedia
                        `
                    }

                </div>

            </div>


            <button
                type="button"
                class="btn btn-primary btn-full product-buy-btn"
                data-product-index="${index}"
                ${isOutOfStock ? "disabled" : ""}
            >

                ${
                    isOutOfStock
                    ?
                    `
                    <span class="material-symbols-rounded">block</span>
                    Stok Habis
                    `
                    :
                    `
                    <span class="material-symbols-rounded">shopping_cart</span>
                    Beli Sekarang
                    `
                }

            </button>

        </div>

    `;


    /*
     * Tombol beli
     */

    const buyButton =
        card.querySelector(
            ".product-buy-btn"
        );


    if (buyButton && !isOutOfStock && DB.site?.maintenance!==true && DB.site?.storeOffline!==true) {

        buyButton.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                buyProduct(product);

            }
        );

    }


    /*
     * Klik card
     */

    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }


            if (!isOutOfStock && DB.site?.maintenance!==true && DB.site?.storeOffline!==true) {

                openProductModal(
                    product
                );

            }

        }
    );


    return card;

}


/* =========================================================
   PRODUCT MODAL
========================================================= */

function openProductModal(product) {

    if (DB.site?.maintenance===true || DB.site?.storeOffline===true) return;

    if (!product) {
        return;
    }


    selectedProduct =
        product;


    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) {
        return;
    }


    const name =
        product.name ||
        "Produk";


    const description =
        product.description ||
        "Produk JASTEB";


    const price =
        Number(product.price) || 0;


    const category =
        normalizeCategory(
            product.category
        );


    const image =
        product.image ||
        product.img ||
        "";


    setText(
        "modalProductName",
        name
    );


    setText(
        "modalProductDescription",
        description
    );


    setText(
        "modalCategory",
        getCategoryName(category)
    );


    setText(
        "modalPrice",
        formatRupiah(price)
    );


    const modalImage =
        document.getElementById(
            "modalImage"
        );


    if (modalImage) {

        if (image) {

            modalImage.src =
                image;

            modalImage.alt =
                name;

            modalImage.style.display =
                "block";

        } else {

            modalImage.removeAttribute(
                "src"
            );

            modalImage.style.display =
                "none";

        }

    }


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    selectedProduct =
        null;

}


/* =========================================================
   SETUP MODAL
========================================================= */

function setupModal() {

    const closeButton =
        document.getElementById(
            "closeModal"
        );


    const overlay =
        document.querySelector(
            ".modal-overlay"
        );


    const buyButton =
        document.getElementById(
            "modalBuyButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (buyButton) {

        buyButton.addEventListener(
            "click",
            () => {

                if (!selectedProduct) {
                    return;
                }


                buyProduct(
                    selectedProduct
                );

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeProductModal();

            }

        }
    );

}


/* =========================================================
   BUY PRODUCT
========================================================= */

function buyProduct(product) {

    if (!product) {
        return;
    }


    const stock =
        getStock(product);


    if (stock <= 0) {

        showToast(
            "Stok Habis",
            "Produk ini sedang tidak tersedia."
        );

        return;

    }


    /*
     * Simpan produk ke sessionStorage
     * agar payment.html bisa membaca
     */

    const checkoutData = {

        id:
            product.id ||
            generateID(),

        name:
            product.name ||
            "Produk",

        price:
            Number(product.price) || 0,

        category:
            product.category ||
            "jasteb",

        description:
            product.description ||
            "",

        image:
            product.image ||
            product.img ||
            "",

        stock:
            stock

    };


    try {
        const payload = JSON.stringify(checkoutData);
        sessionStorage.setItem("yamzz_selected_product", payload);
        // Backward compatibility with older payment.js versions.
        sessionStorage.setItem("yamzz_checkout", payload);
    } catch (error) {
        console.error("SessionStorage error:", error);
        showToast("Gagal", "Browser memblokir penyimpanan checkout.");
        return;
    }


    closeProductModal();


    window.location.href =
        CONFIG.PAYMENT_PAGE;

}


/* =========================================================
   CATEGORY BUTTON
========================================================= */

function setupCategoryButtons() {

    const buttons =
        document.querySelectorAll(
            ".category-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        button.dataset.category ||
                        "all";


                  currentCategory =
                        normalizeCategory(
                            category
                        );


                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    renderProducts();

                }
            );

        }
    );

}


/* =========================================================
   CATEGORY NORMALIZER
========================================================= */

function normalizeCategory(category) {

    if (!category) {
        return "jasteb";
    }


    const value =
        String(category)
            .toLowerCase()
            .trim();


    if (
        value === "all" ||
        value === "semua"
    ) {

        return "all";

    }


    if (
        value.includes("sewa")
    ) {

        return "sewa-jasteb";

    }

   if (
        value.includes("ress")
    ) {

        return "email-ress";

   }

    if (
        value.includes("pt")
    ) {

        return "pt-jasteb";

    }


    return "jasteb";

}

/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(category) {

    switch (
        normalizeCategory(category)
    ) {

        case "sewa-jasteb":
            return "SEWA JASTEB";

        case "pt-jasteb":
            return "PT JASTEB";

        case "email-ress":
            return "EMAIL RESS";
          
        case "jasteb":
        default:
            return "JASTEB";

    }

}


/* =========================================================
   STOCK
========================================================= */

function getStock(product) {

    if (!product) {
        return 0;
    }


    /*
     * Support:
     *
     * stock: 10
     * stok: 10
     * quantity: 10
     */

    let stock =
        product.stock;


    if (
        stock === undefined ||
        stock === null
    ) {

        stock =
            product.stok;

    }


    if (
        stock === undefined ||
        stock === null
    ) {

        stock =
            product.quantity;

    }


    const number =
        Number(stock);


    if (
        Number.isNaN(number)
    ) {

        return 0;

    }


    return Math.max(
        0,
        number
    );

}


/* =========================================================
   PRODUCT COUNT
========================================================= */

function updateProductCount() {

    const total =
        DB.products.length;


    setText(
        "totalProducts",
        total
    );


    setText(
        "productCount",
        `${total} Produk`
    );

}


/* =========================================================
   WHATSAPP
========================================================= */

function setupWhatsApp(number) {

    const clean =
        cleanPhoneNumber(
            number
        );


    if (!clean) {

        hideElement(
            "navWhatsapp"
        );

        hideElement(
            "heroWhatsapp"
        );

        hideElement(
            "aboutWhatsapp"
        );

        hideElement(
            "footerWhatsapp"
        );

        hideElement(
            "floatingWhatsapp"
        );

        return;

    }


    const url =
        `https://wa.me/${clean}`;


    setLink(
        "navWhatsapp",
        url
    );


    setLink(
        "heroWhatsapp",
        url
    );


    setLink(
        "aboutWhatsapp",
        url
    );


    setLink(
        "footerWhatsapp",
        url
    );


    setLink(
        "floatingWhatsapp",
        url
    );


    showElement(
        "navWhatsapp"
    );


    showElement(
        "heroWhatsapp"
    );


    showElement(
        "aboutWhatsapp"
    );


    showElement(
        "footerWhatsapp"
    );


    showElement(
        "floatingWhatsapp"
    );

}


/* =========================================================
   EMAIL
========================================================= */

function setupEmail(email) {

    const element =
        document.getElementById(
            "footerEmail"
        );


    if (!element) {
        return;
    }


    if (!email) {

        element.style.display =
            "none";

        return;

    }


    element.href =
        `mailto:${email}`;

    element.style.display =
        "";

}


/* =========================================================
   SOCIAL MEDIA
========================================================= */

function setupSocial(id, url) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (!url) {

        element.style.display =
            "none";

        return;

    }


    element.href =
        normalizeSocialURL(
            url
        );


    element.target =
        "_blank";

    element.rel =
        "noopener noreferrer";

    element.style.display =
        "flex";

}


/* =========================================================
   SOCIAL URL NORMALIZER
========================================================= */

function normalizeSocialURL(url) {

    if (!url) {
        return "#";
    }


    const value =
        String(url).trim();


    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    ) {

        return value;

    }


    return `https://${value}`;

}


/* =========================================================
   PHONE NORMALIZER
========================================================= */

function cleanPhoneNumber(number) {

    if (!number) {
        return "";
    }


    let value =
        String(number)
            .replace(
                /[^0-9+]/g,
                ""
            );


    if (
        value.startsWith("+62")
    ) {

        value =
            value.substring(1);

    }


    if (
        value.startsWith("62")
    ) {

        return value;

    }


    if (
        value.startsWith("0")
    ) {

        return (
            "62" +
            value.substring(1)
        );

    }


    return value;

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".nav-link"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

                    links.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    link.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    /*
     * Active section saat scroll
     */

    const sections =
        document.querySelectorAll(
            "main section[id]"
        );


    if (
        "IntersectionObserver"
        in window
    ) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(
                        entry => {

                            if (
                                entry.isIntersecting
                            ) {

                                links.forEach(
                                    link => {

                                        link.classList.toggle(
                                            "active",
                                            link.getAttribute(
                                                "href"
                                            ) ===
                                            `#${entry.target.id}`
                                        );

                                    }
                                );

                            }

                        }
                    );

                },
                {
                    threshold: 0.35
                }
            );


        sections.forEach(
            section => {

                observer.observe(
                    section
                );

            }
        );

    }

}


/* =========================================================
   LOADER
========================================================= */

function showLoader() {

    const loader =
        document.getElementById(
            "loader"
        );


    if (!loader) {
        return;
    }


    loader.classList.remove(
        "hidden"
    );


    loader.style.display =
        "flex";

}


function hideLoader() {

    const loader =
        document.getElementById(
            "loader"
        );


    if (!loader) {
        return;
    }


    loader.classList.add(
        "hidden"
    );


    setTimeout(
        () => {

            loader.style.display =
                "none";

        },
        300
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    setText(
        "toastTitle",
        title
    );


    setText(
        "toastMessage",
        message
    );


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.yamzzToastTimer
    );


    window.yamzzToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

}


/* =========================================================
   SET IMAGE
========================================================= */

function setImage(
    id,
    src,
    alt = ""
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (src) {

        element.src =
            src;

        element.alt =
            alt;

        element.style.display =
            "";

    } else {

        element.removeAttribute(
            "src"
        );

        element.style.display =
            "none";

    }

}


/* =========================================================
   SET LINK
========================================================= */

function setLink(
    id,
    href
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.href =
        href;


    element.target =
        "_blank";


    element.rel =
        "noopener noreferrer";

}


/* =========================================================
   SHOW ELEMENT
========================================================= */

function showElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.display =
            "";

    }

}


/* =========================================================
   HIDE ELEMENT
========================================================= */

function hideElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.display =
            "none";

    }

}


/* =========================================================
   RUPIAH FORMAT
========================================================= */

function formatRupiah(number) {

    const value =
        Number(number) || 0;


    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }
    ).format(value);

}


/* =========================================================
   GENERATE ID
========================================================= */

function generateID() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(value) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   FOOTER YEAR
========================================================= */

function setupFooterYear() {

    const year =
        document.getElementById(
            "footerYear"
        );


    if (year) {

        year.textContent =
            new Date()
                .getFullYear();

    }

}



function renderAboutContact(){
  const s=DB.site||{};
  setText("aboutCardName",s.name||"Yamzz Market");
  const email=document.getElementById("aboutEmail");
  const emailText=document.getElementById("aboutEmailText");
  if(emailText) emailText.textContent=s.email||"Email belum diatur";
  if(email){
    if(s.email){email.href=`mailto:${s.email}`;email.style.display="";}
    else email.style.display="none";
  }
  const wa=cleanPhoneNumber(s.whatsapp);
  const waUrl=wa?`https://wa.me/${wa}`:"";
  ["aboutWaContact","aboutWhatsapp"].forEach(id=>{
    const e=document.getElementById(id);
    if(e){if(waUrl){e.href=waUrl;e.style.display="";}else e.style.display="none";}
  });
  const channel=document.getElementById("whatsappChannel");
  if(channel){
    if(s.whatsappChannel){channel.href=normalizeSocialURL(s.whatsappChannel);channel.style.display="inline-flex";}
    else {channel.href=waUrl||"#";channel.style.display=waUrl?"inline-flex":"none";}
  }
  [["aboutTiktok",s.socials?.tiktok],["aboutInstagram",s.socials?.instagram],["aboutYoutube",s.socials?.youtube],["aboutTelegram",s.socials?.telegram]].forEach(([id,url])=>{
    const e=document.getElementById(id); if(!e)return;
    if(url){e.href=normalizeSocialURL(url);e.style.display="flex";} else e.style.display="none";
  });
}

/* =========================================================
   MULTI-PAGE SEARCH / HOME DASHBOARD / GUIDES
========================================================= */
function setupProductSearch(){
  const input=document.getElementById("productSearch");
  if(!input) return;
  input.addEventListener("input", renderProducts);
  const clear=document.getElementById("clearSearch");
  if(clear) clear.addEventListener("click",()=>{input.value="";renderProducts();input.focus()});
}
function renderProducts(){
  const container=document.getElementById("productsContainer");
  const emptyState=document.getElementById("emptyProducts");
  if(!container) return;
  let products=[...DB.products];
  if(currentCategory!=="all") products=products.filter(p=>normalizeCategory(p.category)===currentCategory);
  const q=(document.getElementById("productSearch")?.value||"").trim().toLowerCase();
  if(q) products=products.filter(p=>`${p.name||""} ${p.description||""} ${p.category||""}`.toLowerCase().includes(q));
  container.innerHTML="";
  if(!products.length){if(emptyState) emptyState.style.display="block";return}
  if(emptyState) emptyState.style.display="none";
  products.forEach((product,index)=>container.appendChild(createProductCard(product,index)));
  const visible=document.getElementById("productCount");
  if(visible) visible.textContent=`${products.length} Produk`;
}
function renderHomeDashboard(){
  if(!document.getElementById("homeStats")) return;
  const products=DB.products||[];
  const totalStock=products.reduce((sum,p)=>sum+getStock(p),0);
  const cats=new Set(products.map(p=>normalizeCategory(p.category)));
  const orders=DB.orders||[];
  const stats=[
    ["homeTotalProducts",products.length],
    ["homeTotalStock",totalStock],
    ["homeTotalCategories",cats.size],
    ["homeTotalOrders",orders.length]
  ];
  stats.forEach(([id,val])=>setText(id,String(val)));
  const ticker=document.getElementById("tickerText");
  if(ticker){
    const text=DB.site.notification || `Selamat datang di ${DB.site.name} • Produk tersedia ${products.length} • Transaksi diproses dengan cepat dan aman`;
    ticker.textContent=text;
    ticker.dataset.text=text;
  }
}
function setupGuides(){
  document.querySelectorAll(".guide-button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const item=btn.closest(".guide-item");
      const was=item.classList.contains("open");
      document.querySelectorAll(".guide-item.open").forEach(x=>x.classList.remove("open"));
      if(!was){
        item.classList.add("open");
        setTimeout(()=>item.scrollIntoView({behavior:"smooth",block:"center"}),40);
      }
    });
  });
}

/* =========================================================
   SYSTEM STATUS / MAINTENANCE / STORE OFFLINE
========================================================= */
function renderSystemStatus(){
  const existing=document.getElementById("yamzzSystemOverlay");
  if(existing) existing.remove();
  document.body.classList.remove("yamzz-maintenance-active","yamzz-store-offline");
  const maintenance=DB.site?.maintenance===true;
  const offline=!maintenance && DB.site?.storeOffline===true;
  if(!maintenance && !offline) return;

  document.body.classList.add(maintenance?"yamzz-maintenance-active":"yamzz-store-offline");
  const overlay=document.createElement("div");
  overlay.id="yamzzSystemOverlay";
  overlay.className="yamzz-system-overlay";
  overlay.setAttribute("role","alertdialog");
  overlay.setAttribute("aria-modal","true");
  overlay.innerHTML=`
    <div class="yamzz-system-card">
      <div class="yamzz-system-icon"><span class="material-symbols-rounded">${maintenance?"build":"storefront"}</span></div>
      <span class="yamzz-system-label">${maintenance?"SYSTEM MAINTENANCE":"STORE OFFLINE"}</span>
      <h2>${maintenance?"Website Sedang Maintenance":"Store Sudah Close"}</h2>
      <p>${maintenance?"Sistem sedang dalam proses maintenance. Untuk sementara seluruh fitur website dinonaktifkan. Silakan kembali lagi nanti.":"Maaf, store sedang ditutup untuk sementara. Silakan kembali lagi nanti."}</p>
      <div class="yamzz-system-status"><span class="material-symbols-rounded">schedule</span>${maintenance?"Kami akan segera kembali.":"Terima kasih atas pengertiannya."}</div>
    </div>`;
  document.body.appendChild(overlay);

  // Maintenance mengunci seluruh interaksi pelanggan.
  if(maintenance){
    const block=e=>{e.preventDefault();e.stopPropagation();};
    ["click","pointerdown","touchstart","keydown"].forEach(type=>overlay.addEventListener(type,block,true));
  }
}

/* =========================================================
   AUTO REFRESH DATABASE
   Setiap 60 detik
========================================================= */

setInterval(
    async () => {

        try {

            const data =
                await getDatabase();


            DB =
                normalizeDatabase(
                    data
                );


            renderStore();
            renderHomeDashboard();

            renderProducts();
            renderSystemStatus();

        } catch (error) {

            console.warn(
                "Auto refresh gagal:",
                error
            );

        }

    },
    60000
);


/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.YamzzMarket = {

    getDatabase,

    renderProducts,

    renderStore,

    openProductModal,

    closeProductModal,

    formatRupiah,
    getData: () => DB

};
