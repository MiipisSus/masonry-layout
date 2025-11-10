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

        const galleryContainer = container.querySelector(
          ".image-container[data-gallery]"
        );
        if (galleryContainer) {
          initializeGalleryContainer(galleryContainer);
        }
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
    container.removeEventListener("mouseenter", container._mouseenterHandler);
    container.removeEventListener("mouseleave", container._mouseleaveHandler);

    container._mouseenterHandler = function () {
      const imageContainer = container.querySelector(".image-container");
      const img = imageContainer
        ? imageContainer.querySelector(".gallery-image") ||
          imageContainer.querySelector("img")
        : container.querySelector("img");

      const galleryBtn = imageContainer
        ? imageContainer.querySelector(".gallery-btn")
        : container.querySelector(".gallery-btn");

      const interactBtn = imageContainer
        ? imageContainer.querySelector(".interact-btn")
        : container.querySelector(".interact-btn");

      if (img) {
        gsap.to(img, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        });

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
      }
    };

    container._mouseleaveHandler = function () {
      const imageContainer = container.querySelector(".image-container");
      const img = imageContainer
        ? imageContainer.querySelector(".gallery-image") ||
          imageContainer.querySelector("img")
        : container.querySelector("img");

      const galleryBtn = imageContainer
        ? imageContainer.querySelector(".gallery-btn")
        : container.querySelector(".gallery-btn");

      const interactBtn = imageContainer
        ? imageContainer.querySelector(".interact-btn")
        : container.querySelector(".interact-btn");

      if (img) {
        gsap.to(img, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });

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
      }
    };

    container.addEventListener("mouseenter", container._mouseenterHandler);
    container.addEventListener("mouseleave", container._mouseleaveHandler);
  }

  function setupHoverEffects() {
    document.querySelectorAll(".grid-wrapper > div").forEach((container) => {
      setupHoverEffectForContainer(container);
    });
  }

  setupHoverEffects();
  setupGalleryControls();

  // 追蹤滑鼠位置，用於圖片切換後檢查 hover 狀態
  document.addEventListener("mousemove", (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
  });

  function setupGalleryControls() {
    document
      .querySelectorAll(".image-container[data-gallery]")
      .forEach((container) => {
        const prevBtn = container.querySelector(".gallery-prev");
        const nextBtn = container.querySelector(".gallery-next");

        if (prevBtn && nextBtn) {
          prevBtn.addEventListener("click", () =>
            changeGalleryImage(container, -1)
          );
          nextBtn.addEventListener("click", () =>
            changeGalleryImage(container, 1)
          );
        }

        initializeGalleryContainer(container);
      });
  }

  function initializeGalleryContainer(container) {
    const img = container.querySelector(".gallery-image");
    if (img) {
      // 檢查是否有多張圖片，如果有則添加 gallery-info
      const galleryData = container.dataset.gallery;
      if (galleryData) {
        const gallery = JSON.parse(galleryData);
        if (gallery.length > 1) {
          // 檢查是否已經存在 gallery-info，避免重複添加
          if (!container.querySelector(".gallery-info")) {
            const galleryInfo = document.createElement("div");
            galleryInfo.className = "gallery-info";
            galleryInfo.innerHTML = '<i class="ri-multi-image-fill"></i>';
            container.appendChild(galleryInfo);
          }
        }
      }

      const tempImg = new Image();
      tempImg.onload = () => {
        const aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;
        const paddingBottom = aspectRatio * 100 + "%";

        // 設定 padding-bottom 來維持響應式比例
        container.style.setProperty("--gallery-padding-bottom", paddingBottom);

        gsap.set(img, {
          x: "0%",
          zIndex: "auto",
        });
      };
      tempImg.src = img.src;
    }
  }

  function changeGalleryImage(container, direction) {
    const gallery = JSON.parse(container.dataset.gallery);
    let currentIndex = parseInt(container.dataset.currentIndex);
    const oldIndex = currentIndex;

    currentIndex += direction;

    if (currentIndex < 0) {
      currentIndex = gallery.length - 1;
    } else if (currentIndex >= gallery.length) {
      currentIndex = 0;
    }

    container.dataset.currentIndex = currentIndex;

    const currentImg = container.querySelector(".gallery-image");

    const newImg = document.createElement("img");
    newImg.className = "gallery-image";
    newImg.src = gallery[currentIndex];

    const slideDirection = direction > 0 ? 1 : -1;

    gsap.set(newImg, {
      x: slideDirection * 100 + "%",
      zIndex: 1,
    });

    gsap.set(currentImg, {
      zIndex: 0,
    });

    container.appendChild(newImg);

    const tempImg = new Image();
    tempImg.onload = () => {
      const timeline = gsap.timeline({
        onComplete: () => {
          currentImg.remove();
          gsap.set(newImg, { zIndex: "auto" });

          const parentContainer = container.closest(".grid-wrapper > div");
          if (parentContainer) {
            setupHoverEffectForContainer(parentContainer);

            // 檢查滑鼠是否還在容器內，如果是的話保持 hover 狀態
            setTimeout(() => {
              const rect = parentContainer.getBoundingClientRect();
              const mouseX = window.mouseX || 0;
              const mouseY = window.mouseY || 0;

              if (
                mouseX >= rect.left &&
                mouseX <= rect.right &&
                mouseY >= rect.top &&
                mouseY <= rect.bottom
              ) {
                if (parentContainer._mouseenterHandler) {
                  parentContainer._mouseenterHandler();
                }
              }
            }, 50);
          }
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
    };

    tempImg.src = gallery[currentIndex];
  }
});
