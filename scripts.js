document.addEventListener("DOMContentLoaded", function () {
  const BATCH_SIZE = 20;
  const SCROLL_THRESHOLD = 300;

  let currentBatchIndex = 0;
  let isLoadingBatch = false;
  let scrollTimeout;
  const imageContainers = document.querySelectorAll(".grid-wrapper > div");
  function showPageLoading() {
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "page-loading";
    loadingOverlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
  }

  function hidePageLoading() {
    const loadingOverlay = document.getElementById("page-loading");
    if (loadingOverlay) {
      loadingOverlay.style.opacity = "0";
      setTimeout(() => {
        loadingOverlay.remove();
      }, 300);
    }
  }

  function showBatchLoading() {
    if (document.getElementById("batch-loading")) return;

    const batchLoadingIndicator = document.createElement("div");
    batchLoadingIndicator.id = "batch-loading";
    batchLoadingIndicator.innerHTML = `
      <div class="batch-loading-spinner">
        <div class="spinner"></div>
      </div>
    `;
    document.body.appendChild(batchLoadingIndicator);
  }

  function hideBatchLoading() {
    const batchLoadingIndicator = document.getElementById("batch-loading");
    if (batchLoadingIndicator) {
      batchLoadingIndicator.style.opacity = "0";
      setTimeout(() => {
        batchLoadingIndicator.remove();
      }, 300);
    }
  }

  function getGalleryButton(container) {
    const imageContainer = container.querySelector(".image-container");
    return imageContainer
      ? imageContainer.querySelector(".gallery-btn")
      : container.querySelector(".gallery-btn");
  }

  function getInteractButton(container) {
    const imageContainer = container.querySelector(".image-container");
    return imageContainer
      ? imageContainer.querySelector(".interact-btn")
      : container.querySelector(".interact-btn");
  }

  function animateElementsOnHover(
    container,
    galleryBtn,
    interactBtn,
    isEntering
  ) {
    const scale = isEntering ? 1.05 : 1;
    const opacity = isEntering ? 1 : 0;
    const y = isEntering ? 0 : undefined;

    const allGalleryImages = container.querySelectorAll(".gallery-image, img");
    allGalleryImages.forEach((img) => {
      gsap.to(img, {
        scale: scale,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    if (galleryBtn) {
      gsap.to(galleryBtn, {
        opacity: opacity,
        y: y,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (interactBtn) {
      gsap.to(interactBtn, {
        opacity: opacity,
        y: y,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }

  function setupAllButtonHoverEffects() {
    document
      .querySelectorAll(".gallery-btn i, .interact-btn i")
      .forEach((icon) => {
        if (icon._hoverSetup) return;

        icon._hoverSetup = true;

        icon.addEventListener("mouseenter", () => {
          gsap.to(icon, {
            scale: 1.2,
            duration: 0.2,
            ease: "power2.out",
          });
        });

        icon.addEventListener("mouseleave", () => {
          gsap.to(icon, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out",
          });
        });
      });
  }

  function loadImage(container, onComplete) {
    const img = container.querySelector("img");

    if (img && img.dataset.src) {
      const tempImg = new Image();

      tempImg.onload = function () {
        img.src = img.dataset.src;
        if (onComplete) onComplete();
      };

      tempImg.onerror = function () {
        container.className = "error";
        if (onComplete) onComplete();
      };

      tempImg.src = img.dataset.src;
    } else {
      if (onComplete) onComplete();
    }
  }

  function showBatch(containers) {
    containers.forEach((container, index) => {
      setTimeout(() => {
        container.style.display = "block";
        container.classList.add("batch-reveal");
        setupHoverEffectForContainer(container);

        const galleryContainer = container.querySelector(
          ".image-container[data-gallery]"
        );
        if (galleryContainer) {
          initializeGalleryContainer(galleryContainer);
          setupGalleryControlsForContainer(galleryContainer);
        }
      }, index * 50);
    });

    setTimeout(() => {
      setupAllButtonHoverEffects();
      setupShareButtons();
    }, containers.length * 50 + 100);
  }
  function loadBatch(batchIndex) {
    if (isLoadingBatch) return;

    isLoadingBatch = true;

    if (batchIndex > 0) {
      showBatchLoading();
    }

    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, imageContainers.length);

    if (startIndex >= imageContainers.length) {
      isLoadingBatch = false;
      hideBatchLoading();
      return;
    }

    let batchLoadedCount = 0;
    const batchSize = endIndex - startIndex;
    const batchContainers = [];

    for (let i = startIndex; i < endIndex; i++) {
      batchContainers.push(imageContainers[i]);
    }

    batchContainers.forEach((container, index) => {
      loadImage(container, () => {
        batchLoadedCount++;
        if (batchLoadedCount === batchSize) {
          showBatch(batchContainers);
          isLoadingBatch = false;
          currentBatchIndex++;

          hideBatchLoading();

          if (batchIndex === 0) {
            hidePageLoading();
          }
        }
      });
    });
  }

  function setupHoverEffectForSideBar(sideBar) {
    const navLinks = sideBar.querySelectorAll(".nav-section a");
    navLinks.forEach((link) => {
      const linkIcon = link.querySelector("span");
      link.addEventListener("mouseenter", () => {
        gsap.to(linkIcon, {
          x: -5,
          rotate: 45,
          scale: 1.1,
          color: "#87bbc9",
          duration: 0.2,
          ease: "bounce.out",
        });
      });

      link.addEventListener("mouseleave", () => {
        gsap.to(linkIcon, {
          x: 0,
          rotate: 0,
          scale: 1,
          color: "#ffffff",
          duration: 0.2,
          ease: "bounce.out",
        });
      });
    });
  }

  function setupHoverEffectForContainer(container) {
    const imageContainer = container.querySelector(".image-container");
    const targetElement = imageContainer || container;

    if (targetElement._mouseenterHandler) {
      targetElement.removeEventListener(
        "mouseenter",
        targetElement._mouseenterHandler
      );
      targetElement.removeEventListener(
        "mouseleave",
        targetElement._mouseleaveHandler
      );
    }

    targetElement._mouseenterHandler = function () {
      const galleryBtn = getGalleryButton(container);
      const interactBtn = getInteractButton(container);

      animateElementsOnHover(container, galleryBtn, interactBtn, true);
    };

    targetElement._mouseleaveHandler = function () {
      const galleryBtn = getGalleryButton(container);
      const interactBtn = getInteractButton(container);

      animateElementsOnHover(container, galleryBtn, interactBtn, false);
    };

    targetElement.addEventListener(
      "mouseenter",
      targetElement._mouseenterHandler
    );
    targetElement.addEventListener(
      "mouseleave",
      targetElement._mouseleaveHandler
    );
  }

  function setupHoverEffects() {
    const sideBar = document.querySelector(".side-bar");
    setupHoverEffectForSideBar(sideBar);
    document.querySelectorAll(".grid-wrapper > div").forEach((container) => {
      setupHoverEffectForContainer(container);
    });
    setupAllButtonHoverEffects();
  }

  function initializeGalleryContainer(container) {
    const img = container.querySelector(".gallery-image");
    if (!img) return;

    const galleryData = container.dataset.gallery;
    if (galleryData) {
      const gallery = JSON.parse(galleryData);
      if (gallery.length > 1) {
        if (!container.querySelector(".gallery-info")) {
          const currentIndex = parseInt(container.dataset.currentIndex) || 0;
          const galleryInfo = document.createElement("div");
          galleryInfo.className = "gallery-info";
          galleryInfo.innerHTML = `
            <i class="ri-multi-image-fill"></i>
            <div class="gallery-counter">${currentIndex + 1}/${
            gallery.length
          }</div>
          `;
          container.appendChild(galleryInfo);

          const galleryBtn = document.createElement("div");
          galleryBtn.className = "gallery-btn";
          galleryBtn.innerHTML = `
            <i class="ri-arrow-left-fill gallery-prev"></i>
            <i class="ri-arrow-right-fill gallery-next"></i>
          `;
          container.appendChild(galleryBtn);
        }
      }
    }

    const tempImg = new Image();
    tempImg.onload = () => {
      const aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;
      const paddingBottom = aspectRatio * 100 + "%";

      container.style.setProperty("--gallery-padding-bottom", paddingBottom);

      gsap.set(img, {
        x: "0%",
        zIndex: "auto",
      });
    };
    tempImg.src = img.src;
  }

  function updateGalleryCounter(container, currentIndex, totalCount) {
    const galleryCounter = container.querySelector(
      ".gallery-info .gallery-counter"
    );
    if (galleryCounter) {
      galleryCounter.textContent = `${currentIndex + 1}/${totalCount}`;
    }
  }

  function isContainerInHoverState(container) {
    const currentImg = container.querySelector(".gallery-image, img");
    if (currentImg) {
      const matrix = window.getComputedStyle(currentImg).transform;
      if (matrix !== "none") {
        const values = matrix.split("(")[1].split(")")[0].split(",");
        const scaleX = parseFloat(values[0]);
        return scaleX > 1.01;
      }
    }
    return false;
  }

  function createNewGalleryImage(
    src,
    slideDirection,
    shouldApplyHoverScale = false
  ) {
    const newImg = document.createElement("img");
    newImg.className = "gallery-image";
    newImg.src = src;

    const initialScale = shouldApplyHoverScale ? 1.05 : 1;

    gsap.set(newImg, {
      x: slideDirection * 100 + "%",
      zIndex: 1,
      scale: initialScale,
    });

    return newImg;
  }

  function animateGalleryTransition(currentImg, newImg, slideDirection) {
    const timeline = gsap.timeline({
      onComplete: () => {
        currentImg.remove();
        gsap.set(newImg, { zIndex: "auto" });
      },
    });

    timeline
      .to(currentImg, {
        x: -slideDirection * 100 + "%",
        duration: 0.5,
        ease: "power2.inOut",
      })
      .to(
        newImg,
        {
          x: "0%",
          duration: 0.5,
          ease: "power2.inOut",
        },
        0
      );
  }

  function changeGalleryImage(container, direction) {
    const gallery = JSON.parse(container.dataset.gallery);
    let currentIndex = parseInt(container.dataset.currentIndex);

    currentIndex += direction;

    if (currentIndex < 0) {
      currentIndex = gallery.length - 1;
    } else if (currentIndex >= gallery.length) {
      currentIndex = 0;
    }

    container.dataset.currentIndex = currentIndex;
    updateGalleryCounter(container, currentIndex, gallery.length);

    const currentImg = container.querySelector(".gallery-image");
    const slideDirection = direction > 0 ? 1 : -1;

    const parentContainer = container.closest(".grid-wrapper > div");
    const isHovered =
      parentContainer && isContainerInHoverState(parentContainer);

    const newImg = createNewGalleryImage(
      gallery[currentIndex],
      slideDirection,
      isHovered
    );

    gsap.set(currentImg, { zIndex: 0 });
    container.appendChild(newImg);

    const tempImg = new Image();
    tempImg.onload = () => {
      animateGalleryTransition(currentImg, newImg, slideDirection);
    };
    tempImg.src = gallery[currentIndex];
  }

  function setupGalleryControlsForContainer(container) {
    const prevBtn = container.querySelector(".gallery-prev");
    const nextBtn = container.querySelector(".gallery-next");

    if (prevBtn && nextBtn) {
      // 移除舊的事件監聽器，避免重複綁定
      prevBtn.removeEventListener("click", prevBtn._clickHandler);
      nextBtn.removeEventListener("click", nextBtn._clickHandler);

      // 建立新的事件監聽器
      prevBtn._clickHandler = () => changeGalleryImage(container, -1);
      nextBtn._clickHandler = () => changeGalleryImage(container, 1);

      prevBtn.addEventListener("click", prevBtn._clickHandler);
      nextBtn.addEventListener("click", nextBtn._clickHandler);
    }
  }

  function setupGalleryControls() {
    document
      .querySelectorAll(".image-container[data-gallery]")
      .forEach((container) => {
        setupGalleryControlsForContainer(container);
        initializeGalleryContainer(container);
      });
  }

  function handleScroll() {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (
      scrollPosition >= documentHeight - SCROLL_THRESHOLD &&
      !isLoadingBatch &&
      currentBatchIndex * BATCH_SIZE < imageContainers.length
    ) {
      loadBatch(currentBatchIndex);
    }
  }

  function trackMousePosition(e) {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
  }

  function handleShareClick(shareBtn) {
    const socialBtn = shareBtn.parentElement.querySelector(".social-btn");
    if (!socialBtn) {
      console.warn("找不到 .social-btn 元素");
      return;
    }

    const socialIcons = socialBtn.querySelectorAll("i");
    if (socialIcons.length === 0) {
      console.warn("找不到社交按鈕圖示");
      return;
    }

    const isActive = shareBtn.classList.contains("ri-share-fill");

    if (isActive) {
      shareBtn.className = "ri-share-line";

      gsap.to(socialIcons, {
        opacity: 0,
        duration: 0.3,
        stagger: -0.1,
        ease: "power2.out",
        onComplete: () => {
          socialBtn.style.transform = "scaleX(0)";
          setTimeout(() => {
            socialBtn.style.visibility = "hidden";
          }, 300);
        },
      });
    } else {
      shareBtn.className = "ri-share-fill";
      socialBtn.style.visibility = "visible";
      socialBtn.style.transform = "scaleX(1)";

      setTimeout(() => {
        gsap.to(socialIcons, {
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        });
      }, 100);
    }
  }
  function setupShareButtons() {
    document.querySelectorAll("[class*='ri-share']").forEach((shareBtn) => {
      if (shareBtn._shareSetup) return;
      shareBtn._shareSetup = true;

      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleShareClick(shareBtn);
      });
    });
  }

  window.addNewImage = function (imageSrc, targetContainer) {
    const newDiv = document.createElement("div");
    const newImg = document.createElement("img");

    newDiv.style.display = "none";
    newImg.dataset.src = imageSrc;
    newImg.src = "";
    newImg.alt = "";
    newDiv.appendChild(newImg);

    if (targetContainer) {
      targetContainer.appendChild(newDiv);
    } else {
      document.querySelector(".grid-wrapper").appendChild(newDiv);
    }

    loadImage(newDiv, () => {
      showBatch([newDiv]);
    });

    return newDiv;
  };

  window.loadNextBatch = function () {
    if (
      !isLoadingBatch &&
      currentBatchIndex * BATCH_SIZE < imageContainers.length
    ) {
      loadBatch(currentBatchIndex);
    }
  };

  window.setBatchSize = function (newSize) {
    if (newSize > 0) {
      console.log(
        `當前批次大小：${BATCH_SIZE}，如需修改請在腳本頂部修改 BATCH_SIZE 變數`
      );
    }
  };

  function initializeApp() {
    showPageLoading();

    imageContainers.forEach((container, index) => {
      const img = container.querySelector("img");
      if (img) {
        img.dataset.src = img.src;
        img.src = "";
        container.style.display = "none";
      }
    });

    window.addEventListener("scroll", function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    });

    document.addEventListener("mousemove", trackMousePosition);

    loadBatch(0);

    setupHoverEffects();
    setupGalleryControls();
    setupShareButtons();
  }

  initializeApp();
});
