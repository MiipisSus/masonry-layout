document.addEventListener("DOMContentLoaded", function () {
  const BATCH_SIZE = 20;
  const SCROLL_THRESHOLD = 300;

  showPageLoading();

  const imageContainers = document.querySelectorAll(".grid-wrapper > div");
  let currentBatchIndex = 0;
  let isLoadingBatch = false;

  imageContainers.forEach((container, index) => {
    const img = container.querySelector("img");
    if (img) {
      img.dataset.src = img.src;
      img.src = "";
      container.style.display = "none";
    }
  });

  loadBatch(0);

  let scrollTimeout;
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 100);
  });

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
      }, index * 50);
    });
  }

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

  function hidePageLoading() {
    const loadingOverlay = document.getElementById("page-loading");
    if (loadingOverlay) {
      loadingOverlay.style.opacity = "0";
      setTimeout(() => {
        loadingOverlay.remove();
      }, 300);
    }
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

  function setupHoverEffectForContainer(container) {
    const imageContainer = container.querySelector(".image-container");

    // 如果有畫廊包裝器，使用它作為縮放目標，否則使用原始圖片
    const img = imageContainer
      ? imageContainer.querySelector(".gallery-image-wrapper") ||
        imageContainer.querySelector("img")
      : container.querySelector("img");

    const galleryBtn = imageContainer
      ? imageContainer.querySelector(".gallery-btn")
      : container.querySelector(".gallery-btn");
    const interactBtn = imageContainer
      ? imageContainer.querySelector(".interact-btn")
      : container.querySelector(".interact-btn");
    const title = imageContainer
      ? imageContainer.querySelector("h3")
      : container.querySelector("h3");

    if (img && imageContainer) {
      container.removeEventListener("mouseenter", container._mouseenterHandler);
      container.removeEventListener("mouseleave", container._mouseleaveHandler);

      container._mouseenterHandler = function () {
        gsap.to(img, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        });

        if (title) {
          gsap.to(title, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        if (galleryBtn) {
          gsap.to(galleryBtn, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        if (interactBtn) {
          gsap.to(interactBtn, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      };

      container._mouseleaveHandler = function () {
        gsap.to(img, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });

        if (title) {
          gsap.to(title, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        if (galleryBtn) {
          gsap.to(galleryBtn, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        if (interactBtn) {
          gsap.to(interactBtn, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      };

      container.addEventListener("mouseenter", container._mouseenterHandler);
      container.addEventListener("mouseleave", container._mouseleaveHandler);

      setupGalleryForContainer(imageContainer);
    }
  }

  function setupHoverEffects() {
    document.querySelectorAll(".grid-wrapper > div").forEach((container) => {
      setupHoverEffectForContainer(container);
    });
  }

  setupHoverEffects();

  function setupGalleryForContainer(container) {
    if (!container || !container.dataset.gallery) {
      return;
    }

    const galleryData = JSON.parse(container.dataset.gallery);
    const originalImg = container.querySelector("img");
    const prevBtn = container.querySelector(".gallery-prev");
    const nextBtn = container.querySelector(".gallery-next");

    if (
      !galleryData ||
      galleryData.length <= 1 ||
      !originalImg ||
      !prevBtn ||
      !nextBtn
    ) {
      return;
    }

    if (container._galleryInitialized) {
      return;
    }

    // 建立雙層圖片結構
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "gallery-image-wrapper";

    const currentImg = originalImg.cloneNode(true);
    const nextImg = originalImg.cloneNode(true);

    currentImg.className = "gallery-current-img";
    nextImg.className = "gallery-next-img";

    imageWrapper.appendChild(nextImg);
    imageWrapper.appendChild(currentImg);

    originalImg.parentNode.replaceChild(imageWrapper, originalImg);

    let currentIndex = parseInt(container.dataset.currentIndex) || 0;
    let isAnimating = false;

    function updateImages() {
      currentImg.src = galleryData[currentIndex];
      const nextIndex = getNextIndex("next");
      nextImg.src = galleryData[nextIndex];
    }

    function slideImage(direction = "next") {
      if (isAnimating) return;

      const targetIndex = getNextIndex(direction);
      const slideDirection = direction === "next" ? 1 : -1;
      const slideDistance = container.offsetWidth;

      isAnimating = true;

      // 設置底層圖片為即將顯示的圖片
      nextImg.src = galleryData[targetIndex];

      // 當前圖片滑動離開，露出底層圖片
      gsap.to(currentImg, {
        x: -slideDirection * slideDistance,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          // 更新索引
          currentIndex = targetIndex;
          container.dataset.currentIndex = currentIndex;

          // 將滑走的圖片重置到原位並更新內容
          gsap.set(currentImg, { x: 0 });
          currentImg.src = galleryData[currentIndex];

          // 更新底層圖片：根據方向預載下一張或上一張
          let preloadIndex;
          if (direction === "next") {
            preloadIndex = getNextIndex("next");
          } else {
            preloadIndex = getNextIndex("prev");
          }
          nextImg.src = galleryData[preloadIndex];

          isAnimating = false;
        },
      });
    }

    function getNextIndex(direction) {
      let nextIndex = currentIndex + (direction === "next" ? 1 : -1);
      if (nextIndex < 0) nextIndex = galleryData.length - 1;
      if (nextIndex >= galleryData.length) nextIndex = 0;
      return nextIndex;
    }

    // 初始化圖片
    updateImages();

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAnimating) {
        gsap.to(prevBtn, {
          scale: 0.9,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        });
        slideImage("prev");
      }
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAnimating) {
        gsap.to(nextBtn, {
          scale: 0.9,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
        });
        slideImage("next");
      }
    });

    container._galleryInitialized = true;
  }

  function initImageGallery() {
    const galleryContainers = document.querySelectorAll(
      ".image-container[data-gallery]"
    );
    galleryContainers.forEach((container) => {
      setupGalleryForContainer(container);
    });
  }

  initImageGallery();
});
