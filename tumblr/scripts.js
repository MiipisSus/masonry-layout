document.addEventListener("DOMContentLoaded", function () {
  gsap.registerPlugin(ScrollTrigger);
  const BATCH_SIZE = 15;
  const SCROLL_THRESHOLD = 300;
  let currentBatchIndex = 0;
  let isLoadingBatch = false;
  let scrollTimeout;
  let imageContainers = document.querySelectorAll(".grid-wrapper > div");
  
  // Tumblr 分頁系統變數
  let currentPage = 1;
  let isLoadingPage = false;
  let hasMorePages = true;
  
  // 瀑布流佈局變數
  let columnHeights = [];
  let columnCount = 1;
  let columnWidth = 0;
  let gap = 40; // 2.5rem = 40px
  
  // 計算欄位數量
  function getColumnCount() {
    const width = window.innerWidth;
    if (width >= 1920) return 3;
    if (width >= 960) return 3;
    if (width >= 769) return 2;
    if (width >= 481) return 2;
    return 1;
  }
  
  // 初始化瀑布流佈局
  function initMasonryLayout(reset = false) {
    const gridWrapper = document.querySelector('.grid-wrapper');
    if (!gridWrapper) return;
    
    columnCount = getColumnCount();
    const containerWidth = gridWrapper.offsetWidth;
    columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
    
    // 只在重置或首次初始化時清空高度
    if (reset || columnHeights.length === 0) {
      columnHeights = new Array(columnCount).fill(0);
    }
  }
  
  // 計算並設置元素位置
  function positionElement(element) {
    if (!element || element.style.display === 'none') return;
    
    // 找到最短的欄位
    let minHeight = Math.min(...columnHeights);
    let minIndex = columnHeights.indexOf(minHeight);
    
    // 計算位置
    const left = minIndex * (columnWidth + gap);
    const top = minHeight;
    
    // 設置位置和寬度
    element.style.width = `${columnWidth}px`;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    
    // 獲取元素實際高度(同步)
    const elementHeight = element.offsetHeight;
    
    console.log('定位元素:', {
      element: element.querySelector('img')?.src?.substring(0, 50),
      columnIndex: minIndex,
      top: top,
      height: elementHeight,
      columnHeightsBefore: [...columnHeights]
    });
    
    // 更新該欄位高度
    columnHeights[minIndex] += elementHeight + gap;
    
    console.log('更新後 columnHeights:', [...columnHeights]);
    
    // 更新容器總高度
    const gridWrapper = document.querySelector('.grid-wrapper');
    if (gridWrapper) {
      gridWrapper.style.height = `${Math.max(...columnHeights)}px`;
    }
  }
  
  // 重新計算所有元素位置
  function relayoutMasonry() {
    initMasonryLayout(true); // 完全重置
    const containers = document.querySelectorAll('.grid-wrapper > div');
    containers.forEach(container => {
      if (container.classList.contains('loaded') || container.style.display !== 'none') {
        positionElement(container);
      }
    });
  }
  
  // 監聽視窗大小變化
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newColumnCount = getColumnCount();
      // 只有當欄位數量改變時才完全重新排版
      if (newColumnCount !== columnCount) {
        relayoutMasonry();
      } else {
        // 欄位數量沒變,只更新寬度
        const gridWrapper = document.querySelector('.grid-wrapper');
        if (gridWrapper) {
          const containerWidth = gridWrapper.offsetWidth;
          columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
          // 更新所有元素的寬度和左側位置
          const containers = document.querySelectorAll('.grid-wrapper > div');
          containers.forEach(container => {
            if (container.style.display !== 'none') {
              const left = parseFloat(container.style.left);
              const columnIndex = Math.round(left / (columnWidth + gap));
              container.style.width = `${columnWidth}px`;
              container.style.left = `${columnIndex * (columnWidth + gap)}px`;
            }
          });
        }
      }
      ScrollTrigger.refresh();
    }, 250);
  });
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
  function setupAllButtonHoverEffects() {}
  function loadImage(container, onComplete) {
    const img = container.querySelector("img");
    if (img && img.dataset.src) {
      container.classList.add("loading");
      const tempImg = new Image();
      tempImg.onload = function () {
        const aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;
        img.style.aspectRatio = `${tempImg.naturalWidth} / ${tempImg.naturalHeight}`;
        img.src = img.dataset.src;
        container.classList.remove("loading");
        container.classList.add("loaded");
        if (onComplete) onComplete();
      };
      tempImg.onerror = function () {
        container.classList.remove("loading");
        container.classList.add("error");
        if (onComplete) onComplete();
      };
      tempImg.src = img.dataset.src;
    } else {
      if (onComplete) onComplete();
    }
  }
  function showBatch(containers) {
    // 確保佈局已初始化(但不重置欄位高度)
    if (columnHeights.length === 0) {
      initMasonryLayout(false);
    }
    
    // 先處理所有 gallery 容器的初始化
    let galleryInitCount = 0;
    const galleriesToInit = [];
    
    containers.forEach(container => {
      const galleryContainer = container.querySelector(".image-container[data-gallery]");
      if (galleryContainer) {
        galleriesToInit.push({ container, galleryContainer });
      }
    });
    
    // 如果有 gallery 需要初始化,先初始化它們
    if (galleriesToInit.length > 0) {
      galleriesToInit.forEach(({ container, galleryContainer }) => {
        const img = galleryContainer.querySelector(".gallery-image");
        if (img && img.src) {
          const tempImg = new Image();
          tempImg.onload = () => {
            const aspectRatio = tempImg.naturalHeight / tempImg.naturalWidth;
            const paddingBottom = aspectRatio * 100 + "%";
            galleryContainer.style.setProperty("--gallery-padding-bottom", paddingBottom);
            
            galleryInitCount++;
            if (galleryInitCount === galleriesToInit.length) {
              // 所有 gallery 都初始化完成,開始顯示批次
              displayBatch(containers);
            }
          };
          tempImg.onerror = () => {
            galleryInitCount++;
            if (galleryInitCount === galleriesToInit.length) {
              displayBatch(containers);
            }
          };
          tempImg.src = img.src;
        } else {
          galleryInitCount++;
          if (galleryInitCount === galleriesToInit.length) {
            displayBatch(containers);
          }
        }
      });
    } else {
      // 沒有 gallery,直接顯示
      displayBatch(containers);
    }
  }
  
  function displayBatch(containers) {
    console.log('=== displayBatch 開始 ===', {
      containerCount: containers.length,
      columnHeights: [...columnHeights]
    });
    
    containers.forEach((container, index) => {
      container.style.display = "block";
      container.classList.add("batch-reveal");
      
      setupMainContentAnimation(container);
      setupHoverEffectForContainer(container);
      const galleryContainer = container.querySelector(
        ".image-container[data-gallery]"
      );
      if (galleryContainer) {
        initializeGalleryContainer(galleryContainer);
        setupGalleryControlsForContainer(galleryContainer);
      }
    });
    
    // 等待所有元素渲染完成後再進行定位
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('開始定位元素, columnHeights:', [...columnHeights]);
        
        containers.forEach((container) => {
          positionElement(container);
        });
        
        console.log('=== displayBatch 定位完成 ===');
        
        // 設置其他功能
        setTimeout(() => {
          setupAllButtonHoverEffects();
          setupShareButtons();
          setupLinkButtons();
          setupLikeButton();
          setupImageOverlayClick();
          processLikeStatusForBatch(containers);
          
          console.log('ScrollTrigger.refresh 之前, columnHeights:', [...columnHeights]);
          
          // 先刷新 ScrollTrigger
          ScrollTrigger.refresh();
          
          console.log('ScrollTrigger.refresh 之後, columnHeights:', [...columnHeights]);
          
          // 刷新後可能導致高度變化,延遲一點再重新檢查佈局
          setTimeout(() => {
            // 檢查容器高度是否正確
            const gridWrapper = document.querySelector('.grid-wrapper');
            const maxHeight = Math.max(...columnHeights);
            const currentHeight = parseInt(gridWrapper.style.height) || 0;
            
            console.log('檢查高度:', { maxHeight, currentHeight, diff: Math.abs(maxHeight - currentHeight) });
            
            // 如果高度差異太大,重新排版
            if (Math.abs(maxHeight - currentHeight) > 10) {
              console.log('高度差異過大,重新排版');
              relayoutMasonry();
            }
          }, 200);
        }, 100);
      });
    });
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
    if (!container._overlaySetup) {
      container._overlaySetup = true;
      container.addEventListener("click", (e) => {
        if (
          e.target.closest(".gallery-btn") ||
          e.target.closest(".interact-btn") ||
          e.target.classList.contains("gallery-prev") ||
          e.target.classList.contains("gallery-next")
        ) {
          return;
        }
        showImageOverlay(container);
      });
    }
  }
  function setupHoverEffects() {
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
      prevBtn.removeEventListener("click", prevBtn._clickHandler);
      nextBtn.removeEventListener("click", nextBtn._clickHandler);
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
    
    // 檢查是否需要載入已存在的批次
    if (
      scrollPosition >= documentHeight - SCROLL_THRESHOLD &&
      !isLoadingBatch &&
      currentBatchIndex * BATCH_SIZE < imageContainers.length
    ) {
      console.log('載入批次:', currentBatchIndex);
      loadBatch(currentBatchIndex);
    }
    // 檢查是否需要載入新頁面
    else if (
      scrollPosition >= documentHeight - SCROLL_THRESHOLD &&
      !isLoadingBatch &&
      !isLoadingPage &&
      hasMorePages &&
      currentBatchIndex * BATCH_SIZE >= imageContainers.length
    ) {
      console.log('準備載入新頁面:', currentPage + 1);
      console.log('當前狀態:', {
        currentBatchIndex,
        BATCH_SIZE,
        totalContainers: imageContainers.length,
        isLoadingBatch,
        isLoadingPage,
        hasMorePages
      });
      loadNextPage();
    }
  }

  async function loadNextPage() {
    if (isLoadingPage || !hasMorePages) {
      console.log('loadNextPage 被阻止:', { isLoadingPage, hasMorePages });
      return;
    }
    
    isLoadingPage = true;
    showBatchLoading();
    console.log('開始載入頁面:', currentPage + 1);
    
    try {
      currentPage++;
      const url = `?page=${currentPage}`;
      console.log('Fetch URL:', url);
      const response = await fetch(url);
      const html = await response.text();
      console.log('回應長度:', html.length);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContainers = doc.querySelectorAll('.grid-wrapper > div');
      console.log('找到新容器數量:', newContainers.length);
      
      if (newContainers.length === 0) {
        console.log('沒有更多頁面了');
        hasMorePages = false;
        hideBatchLoading();
        isLoadingPage = false;
        return;
      }
      
      const gridWrapper = document.querySelector('.grid-wrapper');
      const newElements = [];
      
      newContainers.forEach(container => {
        const clonedContainer = container.cloneNode(true);
        gridWrapper.appendChild(clonedContainer);
        newElements.push(clonedContainer);
      });
      
      // 先轉換 Tumblr 圖片格式
      newElements.forEach(el => {
        const imageContainer = el.querySelector('.image-container');
        if (imageContainer) {
          const hasNPF = imageContainer.querySelector('.npf_row');
          if (hasNPF) {
            convertTumblrImageStructure(imageContainer);
          }
        }
      });
      
      // 更新 imageContainers
      imageContainers = document.querySelectorAll('.grid-wrapper > div');
      
      console.log('新元素已加入,準備載入圖片');
      
      // 載入新元素的圖片(設置為隱藏狀態,等待批次載入)
      newElements.forEach(container => {
        container.style.display = 'none';
        container.classList.add('loading');
        
        const img = container.querySelector('img');
        if (img && !img.dataset.src) {
          img.dataset.src = img.src;
          img.src = '';
        }
      });
      
      isLoadingPage = false;
      hideBatchLoading();
      
      console.log('新頁面載入完成,等待批次載入系統處理');
      
      // 不要立即顯示,讓批次載入系統自動處理
      // 觸發一次滾動檢查
      handleScroll();
      
    } catch (error) {
      console.error('載入下一頁失敗:', error);
      hasMorePages = false;
      isLoadingPage = false;
      hideBatchLoading();
    }
  }

  function trackMousePosition(e) {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
  }
  function handleShareClick(shareBtn) {
    const socialBtn = shareBtn.parentElement.querySelector(".social-btn");
    const shareBtnIcon = shareBtn.querySelector("i");
    if (!socialBtn) {
      console.warn("找不到 .social-btn 元素");
      return;
    }
    const socialIcons = socialBtn.querySelectorAll("i, a");
    if (socialIcons.length === 0) {
      console.warn("找不到社交按鈕圖示");
      return;
    }
    const isActive = shareBtnIcon.classList.contains("ri-share-fill");
    if (isActive) {
      shareBtnIcon.className = "ri-share-line";
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
      shareBtnIcon.className = "ri-share-fill";
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
    document.querySelectorAll("[class*='share-btn']").forEach((shareBtn) => {
      if (shareBtn._shareSetup) return;
      shareBtn._shareSetup = true;
      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleShareClick(shareBtn);
      });
    });
  }
  
  function getPostUrlFromElement(container) {
    let postUrl = container.querySelector('[data-url]')?.dataset.url || '';
    
    return postUrl;
  }
  
  function copyPostUrl(container) {
    const postUrl = getPostUrlFromElement(container);
      
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(postUrl)
    }
  }
  
  function setupLinkButtons() {
    document.querySelectorAll(".ri-links-line").forEach((linkBtn) => {
      if (linkBtn._linkSetup) return;
      linkBtn._linkSetup = true;
      
      const postContainer = linkBtn.closest('.grid-wrapper > div');
      
      linkBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        
        linkBtn.classList.add("clicked");
        
        setTimeout(() => {
          linkBtn.classList.remove("clicked");
        }, 400);
        
        copyPostUrl(postContainer);
      });
    });
  }
  function setupLikeButton() {
    document.querySelectorAll(".like-btn").forEach((likeBtnArea) => {
      if (likeBtnArea._likeSetup) return;
      likeBtnArea._likeSetup = true;
      
      const heartIcon = likeBtnArea.querySelector("[class*='ri-heart']");
      const likeButton = likeBtnArea.querySelector(".like_button");
      
      if (!heartIcon || !likeButton) return;
      
      likeBtnArea._isAnimating = false;
      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' || mutation.type === 'childList') {
            const currentIsLiked = heartIcon.classList.contains("ri-heart-fill");
            const newIsLiked = likeButton.classList.contains('liked') || 
                               likeButton.querySelector('.liked');
            
            if (currentIsLiked !== newIsLiked && !likeBtnArea._isAnimating) {
              likeBtnArea._isAnimating = true;
              
              if (newIsLiked) {
                gsap.fromTo(
                  heartIcon,
                  { scale: 1 },
                  {
                    scale: 1.8,
                    duration: 0.2,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                      heartIcon.className = "ri-heart-fill";
                      setTimeout(() => {
                        likeBtnArea._isAnimating = false;
                      }, 50);
                    }
                  }
                );
              } else {
                gsap.to(heartIcon, {
                  scale: 0.8,
                  duration: 0.15,
                  ease: "power2.out",
                  onComplete: () => {
                    heartIcon.className = "ri-heart-line";
                    gsap.to(heartIcon, {
                      scale: 1,
                      duration: 0.2,
                      ease: "power2.out",
                      onComplete: () => {
                        setTimeout(() => {
                          likeBtnArea._isAnimating = false;
                        }, 50);
                      }
                    });
                  },
                });
              }
            } else if (!likeBtnArea._isAnimating) {
              updateLikeIconState(likeBtnArea);
            }
          }
        });
      });
      
      observer.observe(likeButton, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
        childList: true
      });
      
      setTimeout(() => updateLikeIconState(likeBtnArea), 500);
    });
  }
  
  function updateLikeIconState(likeBtnArea) {
    const heartIcon = likeBtnArea.querySelector("[class*='ri-heart']");
    const likeButton = likeBtnArea.querySelector(".like_button");
    
    if (!heartIcon || !likeButton) return;
    
    try {
      const isLiked = likeButton.classList.contains('liked') || 
                      likeButton.querySelector('.liked') ||
                      likeButton.querySelector('iframe')?.contentWindow?.document?.querySelector('.liked');
      
      if (isLiked) {
        heartIcon.className = "ri-heart-fill";
      } else {
        heartIcon.className = "ri-heart-line";
      }
    } catch (e) {
      if (likeButton.classList.contains('liked')) {
        heartIcon.className = "ri-heart-fill";
      } else {
        heartIcon.className = "ri-heart-line";
      }
    }
  }
  function createImageOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "image-overlay";
    overlay.innerHTML = `
      <div class="overlay-close">
        <i class="ri-close-line"></i>
      </div>
      <div class="overlay-content"></div>
    `;
    document.body.appendChild(overlay);
    const closeBtn = overlay.querySelector(".overlay-close");
    closeBtn.addEventListener("click", () => closeImageOverlay());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeImageOverlay();
      }
    });
    return overlay;
  }
  function showImageOverlay(container) {
    let overlay = document.querySelector(".image-overlay");
    if (!overlay) {
      overlay = createImageOverlay();
    }
    document.body.classList.add("no-scroll");
    const overlayContent = overlay.querySelector(".overlay-content");
    overlayContent.innerHTML = "";
    const imageContainer = container.querySelector(
      ".image-container[data-gallery]"
    );
    let isSingleImage = false;
    if (imageContainer) {
      const galleryData = JSON.parse(imageContainer.dataset.gallery);
      galleryData.forEach((imageSrc, index) => {
        const img = document.createElement("img");
        img.className = "overlay-image";
        img.src = imageSrc;
        img.alt = `Gallery image ${index + 1}`;
        overlayContent.appendChild(img);
      });
    } else {
      isSingleImage = true;
      const img = container.querySelector("img");
      if (img) {
        const overlayImg = document.createElement("img");
        overlayImg.className = "overlay-image";
        overlayImg.src = img.src || img.dataset.src;
        overlayImg.alt = img.alt || "Image";
        overlayContent.appendChild(overlayImg);
      }
    }
    if (isSingleImage) {
      overlay.classList.add("single-image");
    } else {
      overlay.classList.remove("single-image");
    }
    overlay.style.display = "flex";
    requestAnimationFrame(() => {
      overlay.scrollTop = 0;
      overlay.scrollTo(0, 0);
    });
    const images = overlayContent.querySelectorAll(".overlay-image");
    gsap.to(overlay, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(images, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.1,
    });
  }
  function closeImageOverlay() {
    const overlay = document.querySelector(".image-overlay");
    if (!overlay) return;
    const images = overlay.querySelectorAll(".overlay-image");
    gsap.to(images, {
      y: 100,
      opacity: 0,
      duration: 0.3,
      stagger: -0.05,
      ease: "power2.in",
    });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.3,
      delay: 0.2,
      onComplete: () => {
        overlay.style.display = "none";
        document.body.classList.remove("no-scroll");
      },
    });
  }
  function setupMainContentAnimation(container) {
    container.classList.add("scroll-reveal");
    ScrollTrigger.create({
      trigger: container,
      start: "top 85%",
      end: "bottom 15%",
      onEnter: () => {
        gsap.to(container, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      },
      onLeave: () => {
        gsap.to(container, {
          opacity: 0.7,
          duration: 0.3,
          ease: "power2.out",
        });
      },
      onEnterBack: () => {
        gsap.to(container, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      },
    });
  }
  function setupImageOverlayClick() {
    document.querySelectorAll(".grid-wrapper > div").forEach((container) => {
      if (container._overlaySetup) return;
      container._overlaySetup = true;
      container.addEventListener("click", (e) => {
        if (
          e.target.closest(".gallery-btn") ||
          e.target.closest(".interact-btn") ||
          e.target.classList.contains("gallery-prev") ||
          e.target.classList.contains("gallery-next")
        ) {
          return;
        }
        showImageOverlay(container);
      });
    });
  }
  function setupMenuToggle() {
    const menuTl = gsap.timeline({ paused: true });
    menuTl
      .to(".menu-section .overlay", {
        x: "0%",
        duration: 0.3,
        ease: "power2.out",
      })
      .from(".menu-section .overlay a", {
        opacity: 0,
        x: -20,
        duration: 0.3,
        stagger: 0.1,
        ease: "power2.out",
      });
    let isMenuOpen = false;
    const menuButton = document.querySelector(".menu-section .right-side");
    if (menuButton) {
      menuButton.addEventListener("click", () => {
        if (isMenuOpen) {
          menuTl.reverse();
          isMenuOpen = false;
        } else {
          menuTl.play();
          isMenuOpen = true;
        }
      });
    }
  }
  function setupHeaderScrollTrigger() {
    const menuSection = document.querySelector(".menu-section");
    const menuAvatar = document.querySelector(".menu-section .avatar");
    const menuSocialIcons = document.querySelectorAll(
      ".menu-section .social-link a"
    );
    const tl = gsap.timeline({ paused: true });
    tl.to(menuAvatar, { opacity: 1, duration: 0.4, ease: "power2.out" }).to(
      menuSocialIcons,
      { opacity: 1, duration: 0.3, stagger: 0.1, ease: "power2.out" },
      "-=0.2"
    );
    if (menuSection) {
      ScrollTrigger.create({
        trigger: document.querySelector(".header"),
        start: "bottom top",
        end: "bottom top",
        onEnter: () => {
          gsap.to(menuSection, {
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            duration: 0.3,
            ease: "power2.out",
          });
          tl.play();
        },
        onLeaveBack: () => {
          gsap.to(menuSection, {
            boxShadow: "none",
            duration: 0.3,
            ease: "power2.out",
          });
          tl.reverse();
        },
      });
    }
  }
  function setupNavigationIndicators() {
    const menuOverlayNavLinks = document.querySelectorAll(
      ".menu-section .overlay a"
    );
    const navIndicator = document.querySelector(
      ".menu-section .overlay .indicator"
    );
    menuOverlayNavLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        gsap.to(navIndicator, {
          y:
            link.offsetTop +
            link.offsetHeight / 2 -
            navIndicator.offsetHeight / 2,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      });
      link.addEventListener("mouseleave", () => {
        gsap.to(navIndicator, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    });
    const sidebarNavLinks = document.querySelectorAll(
      ".side-bar .nav-section a"
    );
    const sidebarIndicator = document.querySelector(
      ".side-bar .nav-section .indicator"
    );
    sidebarNavLinks.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        gsap.to(sidebarIndicator, {
          y:
            link.offsetTop +
            link.offsetHeight / 2 -
            sidebarIndicator.offsetHeight / 2,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      });
      link.addEventListener("mouseleave", () => {
        gsap.to(sidebarIndicator, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
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
  function convertTumblrImageStructure(container) {
    const images = container.querySelectorAll(".post_media_photo_anchor");

    if (images.length === 0) {
      console.warn("沒有找到圖片");
      return container;
    }

    const npfRows = container.querySelectorAll(".npf_row");
    npfRows.forEach((row) => row.remove());

    if (images.length === 1) {
      const img = images[0].querySelector(".post_media_photo");
      const newImg = document.createElement("img");
      newImg.className = "gallery-image";

      const bigPhotoSrc = images[0].getAttribute("data-big-photo");
      const originalSrc = img.getAttribute("src");
      const dataSrc = img.getAttribute("data-src");

      newImg.src = bigPhotoSrc || originalSrc || dataSrc;
      newImg.alt = img.getAttribute("alt") || "";
      newImg.setAttribute("data-src", bigPhotoSrc || originalSrc || dataSrc);

      const originalStyle = img.getAttribute("style");
      if (originalStyle && originalStyle.includes("aspect-ratio")) {
        const aspectRatioMatch = originalStyle.match(/aspect-ratio:\s*([^;]+)/);
        if (aspectRatioMatch) {
          newImg.style.aspectRatio = aspectRatioMatch[1];
          newImg.style.translate = "none";
          newImg.style.rotate = "none";
          newImg.style.scale = "none";
          newImg.style.transform = "translate(0px)";
        }
      }
      container.insertBefore(newImg, container.firstChild);
    } else {
      const galleryUrls = [];

      images.forEach((anchor) => {
        const bigPhotoSrc = anchor.getAttribute("data-big-photo");
        const img = anchor.querySelector(".post_media_photo");
        const originalSrc = img?.getAttribute("src");
        const dataSrc = img?.getAttribute("data-src");

        const imageUrl = bigPhotoSrc || originalSrc || dataSrc;
        if (imageUrl) {
          galleryUrls.push(imageUrl);
        }
      });

      container.setAttribute("data-gallery", JSON.stringify(galleryUrls));
      container.setAttribute("data-current-index", "0");
      const firstImg = images[0].querySelector(".post_media_photo");
      const newImg = document.createElement("img");
      newImg.className = "gallery-image";

      const firstBigPhotoSrc = images[0].getAttribute("data-big-photo");
      const firstOriginalSrc = firstImg.getAttribute("src");
      const firstDataSrc = firstImg.getAttribute("data-src");

      newImg.src = firstBigPhotoSrc || firstOriginalSrc || firstDataSrc;
      newImg.alt = firstImg.getAttribute("alt") || "";

      const originalStyle = firstImg.getAttribute("style");
      if (originalStyle && originalStyle.includes("aspect-ratio")) {
        const aspectRatioMatch = originalStyle.match(/aspect-ratio:\s*([^;]+)/);
        if (aspectRatioMatch) {
          newImg.style.aspectRatio = aspectRatioMatch[1];
          newImg.style.translate = "none";
          newImg.style.rotate = "none";
          newImg.style.scale = "none";
          newImg.style.transform = "translate(0px)";
        }
      }
      container.insertBefore(newImg, container.firstChild);
    }

    const innerP = container.querySelector("p");
    if (innerP) {
      innerP.remove();
    }

    return container;
  }
  function convertAllImageContainers() {
    const containersWithNPF = document.querySelectorAll(
      ".image-container .npf_row"
    );
    const processedContainers = new Set();
    let convertedCount = 0;

    containersWithNPF.forEach((npfRow) => {
      const container = npfRow.closest(".image-container");

      if (container && !processedContainers.has(container)) {
        processedContainers.add(container);

        try {
          convertTumblrImageStructure(container);
          convertedCount++;
        } catch (error) {
          console.error(error);
        }
      }
    });

    return convertedCount;
  }
  function processLikeStatus() {
    const likeButtons = document.querySelectorAll(".like-btn");

    likeButtons.forEach((wrapper) => {
      const likeButton = wrapper.querySelector(".like_button");
      const heartIcon = wrapper.querySelector("[class*='ri-heart']");

      if (!likeButton || !heartIcon) return;

      if (likeButton.classList.contains('liked')) {
        heartIcon.classList.remove("ri-heart-line");
        heartIcon.classList.add("ri-heart-fill");
      } else {
        heartIcon.classList.remove("ri-heart-fill");
        heartIcon.classList.add("ri-heart-line");
      }

      const iframe = likeButton.querySelector("iframe");
      if (iframe) {
        iframe.addEventListener("load", () => {
          setTimeout(() => {
            updateLikeIconState(wrapper);
          }, 100);
        });
      }
    });
  }
  
  function processLikeStatusForBatch(containers) {
    let processedCount = 0;
    const totalLikeButtons = containers.reduce((count, container) => {
      return count + container.querySelectorAll(".like-btn").length;
    }, 0);
    
    if (totalLikeButtons === 0) return;
    
    containers.forEach((container) => {
      const likeButtons = container.querySelectorAll(".like-btn");
      
      likeButtons.forEach((wrapper) => {
        const likeButton = wrapper.querySelector(".like_button");
        const heartIcon = wrapper.querySelector("[class*='ri-heart']");

        if (!likeButton || !heartIcon) {
          processedCount++;
          return;
        }

        if (likeButton.classList.contains('liked')) {
          heartIcon.classList.remove("ri-heart-line");
          heartIcon.classList.add("ri-heart-fill");
        } else {
          heartIcon.classList.remove("ri-heart-fill");
          heartIcon.classList.add("ri-heart-line");
        }

        const iframe = likeButton.querySelector("iframe");
        if (iframe) {
          const handleLoad = () => {
            setTimeout(() => {
              updateLikeIconState(wrapper);
              processedCount++;
            }, 100);
          };
          
          if (iframe.contentWindow) {
            iframe.addEventListener("load", handleLoad);
          } else {
            processedCount++;
          }
        } else {
          processedCount++;
        }
      });
    });
  }
  function initializeApp() {
    showPageLoading();

    convertAllImageContainers();

    imageContainers.forEach((container, index) => {
      const img = container.querySelector("img");
      if (img) {
        img.dataset.src = img.src;
        img.src = "";
        container.style.display = "none";
        container.classList.add("loading");
      }
    });
    window.addEventListener("scroll", function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    });
    document.addEventListener("mousemove", trackMousePosition);
    
    // 初始化瀑布流佈局(首次完全重置)
    initMasonryLayout(true);
    
    loadBatch(0);
    setupHoverEffects();
    setupGalleryControls();
    setupShareButtons();
    setupLinkButtons();
    setupLikeButton();
    setupImageOverlayClick();
    setupHeaderScrollTrigger();
    setupMenuToggle();
    ScrollTrigger.refresh();
    setupNavigationIndicators();
  }
  initializeApp();
});