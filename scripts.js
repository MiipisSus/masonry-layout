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
        classifyImage(tempImg, container);
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
        container.style.display = "flex";
        container.classList.add("batch-reveal");
        // 為新顯示的容器設置hover效果
        setupHoverEffectForContainer(container);
      }, index * 50);
    });
  }

  function checkInitialLoadComplete() {
    hidePageLoading();
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

  function classifyImage(img, container) {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const aspectRatio = width / height;

    let imageType = "";

    const WIDE_RATIO = 1.5;
    const TALL_RATIO = 0.75;
    const BIG_SIZE = 1200;

    if (width >= BIG_SIZE || height >= BIG_SIZE) {
      imageType = "big";
    } else if (aspectRatio >= WIDE_RATIO) {
      imageType = "wide";
    } else if (aspectRatio <= TALL_RATIO) {
      imageType = "tall";
    }

    if (imageType) {
      container.className = imageType + " loaded";
    } else {
      container.className = "loaded";
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

  window.reclassifyAllImages = function () {
    const containers = document.querySelectorAll(".grid-wrapper > div");
    containers.forEach((container) => {
      const img = container.querySelector("img");
      if (img && img.src && img.complete) {
        classifyImage(img, container);
      }
    });
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

  // 為單個容器設置hover效果
  function setupHoverEffectForContainer(container) {
    const img = container.querySelector("img");
    const interactBtn = container.querySelector(".interact-btn");
    const title = container.querySelector("h3");

    if (img) {
      // 移除已存在的事件監聽器
      container.removeEventListener("mouseenter", container._mouseenterHandler);
      container.removeEventListener("mouseleave", container._mouseleaveHandler);

      // 建立新的事件處理函式
      container._mouseenterHandler = function () {
        // 圖片放大效果，保持border-radius
        gsap.to(img, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        });

        // 顯示標題和互動按鈕
        if (title) {
          gsap.to(title, {
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
        // 恢復圖片原始大小
        gsap.to(img, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });

        // 隱藏標題和互動按鈕
        if (title) {
          gsap.to(title, {
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

      // 加入事件監聽器
      container.addEventListener("mouseenter", container._mouseenterHandler);
      container.addEventListener("mouseleave", container._mouseleaveHandler);
    }
  }

  // 為每個 .grid-wrapper 內的容器元素加入 hover 效果
  function setupHoverEffects() {
    document.querySelectorAll(".grid-wrapper > div").forEach((container) => {
      setupHoverEffectForContainer(container);
    });
  }

  // 在圖片載入完成後設置hover效果
  setupHoverEffects();
});
