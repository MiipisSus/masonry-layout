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

    const WIDE_THRESHOLD = 1.3;
    const LARGE_WIDE_THRESHOLD = 1.8;
    const MIN_SIZE_FOR_WIDE = 800;

    if (
      aspectRatio >= LARGE_WIDE_THRESHOLD &&
      (width >= MIN_SIZE_FOR_WIDE || height >= MIN_SIZE_FOR_WIDE)
    ) {
      imageType = "wide-large";
    } else if (aspectRatio >= WIDE_THRESHOLD) {
      imageType = "wide";
    } else {
      imageType = "tall";
    }

    container.className = imageType + " loaded";
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

  function setupHoverEffectForContainer(container) {
    const img = container.querySelector("img");
    const interactBtn = container.querySelector(".interact-btn");
    const title = container.querySelector("h3");

    if (img) {
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
    }
  }

  function setupHoverEffects() {
    document.querySelectorAll(".grid-wrapper > div").forEach((container) => {
      setupHoverEffectForContainer(container);
    });
  }

  setupHoverEffects();

  window.showImageClassification = function () {
    const containers = document.querySelectorAll(".grid-wrapper > div");
    console.log("=== 圖片分類結果 ===");
    containers.forEach((container, index) => {
      const img = container.querySelector("img");
      if (img && img.complete && img.naturalWidth > 0) {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const aspectRatio = width / height;
        const className = container.className;
        console.log(
          `圖片 ${index + 1}: ${width}x${height} (比例: ${aspectRatio.toFixed(
            2
          )}) -> ${className}`
        );
      }
    });
  };
});
