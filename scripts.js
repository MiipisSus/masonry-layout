// 圖片尺寸分類腳本 - 漸進式載入版本
document.addEventListener("DOMContentLoaded", function () {
  // 配置參數
  const INITIAL_LOAD_COUNT = 20; // 初始載入圖片數量
  const SCROLL_THRESHOLD = 300; // 滾動觸發閾值（像素）

  // 顯示整頁loading效果
  showPageLoading();

  // 取得所有包含圖片的 div 容器
  const imageContainers = document.querySelectorAll(".grid-wrapper > div");
  let loadedCount = 0;
  let currentLoadIndex = 0;

  // 初始化容器狀態
  imageContainers.forEach((container, index) => {
    const img = container.querySelector("img");
    if (img) {
      // 儲存原始 src，並清空 src 以防止自動載入
      img.dataset.src = img.src;
      img.src = "";
      container.className = index < INITIAL_LOAD_COUNT ? "loading" : "pending";
    }
  });

  // 載入前20個圖片
  loadNextBatch(INITIAL_LOAD_COUNT);

  // 設置滾動監聽器
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 100);
  });

  // 處理滾動事件
  function handleScroll() {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 當滾動到接近底部時載入更多圖片
    if (
      scrollPosition >= documentHeight - SCROLL_THRESHOLD &&
      currentLoadIndex < imageContainers.length
    ) {
      loadNextBatch(Math.min(10, imageContainers.length - currentLoadIndex)); // 每次載入10張
    }
  }

  // 載入下一批圖片
  function loadNextBatch(count) {
    const endIndex = Math.min(currentLoadIndex + count, imageContainers.length);

    for (let i = currentLoadIndex; i < endIndex; i++) {
      loadImage(imageContainers[i], i);
    }

    currentLoadIndex = endIndex;
  }

  // 載入單張圖片
  function loadImage(container, index) {
    const img = container.querySelector("img");

    if (img && img.dataset.src) {
      container.className = "loading";

      // 建立新的圖片物件來預載入
      const tempImg = new Image();

      tempImg.onload = function () {
        img.src = img.dataset.src;
        classifyImage(tempImg, container);
        loadedCount++;
        checkInitialLoadComplete();
      };

      tempImg.onerror = function () {
        container.className = "error";
        loadedCount++;
        checkInitialLoadComplete();
      };

      tempImg.src = img.dataset.src;
    }
  }

  // 檢查初始載入是否完成
  function checkInitialLoadComplete() {
    if (loadedCount >= Math.min(INITIAL_LOAD_COUNT, imageContainers.length)) {
      hidePageLoading();
    }
  }

  // 顯示整頁loading效果
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

  // 隱藏整頁loading效果
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

    // 判斷圖片類型的邏輯
    let imageType = "";

    // 定義尺寸閾值
    const WIDE_RATIO = 1.5; // 寬圖比例閾值
    const TALL_RATIO = 0.75; // 高圖比例閾值
    const BIG_SIZE = 1200; // 大圖尺寸閾值

    // 判斷是否為大圖（寬度或高度超過閾值）
    if (width >= BIG_SIZE || height >= BIG_SIZE) {
      imageType = "big";
    }
    // 判斷是否為寬圖
    else if (aspectRatio >= WIDE_RATIO) {
      imageType = "wide";
    }
    // 判斷是否為高圖
    else if (aspectRatio <= TALL_RATIO) {
      imageType = "tall";
    }
    // 其他情況為標準圖片（不添加 class）

    // 添加 class 到容器 div
    if (imageType) {
      container.className = imageType + " loaded";
    } else {
      container.className = "loaded";
    }
  }

  // 新增圖片功能（動態添加圖片時使用）
  window.addNewImage = function (imageSrc, targetContainer) {
    const newDiv = document.createElement("div");
    const newImg = document.createElement("img");

    newDiv.className = "pending";
    newImg.dataset.src = imageSrc;
    newImg.src = "";
    newImg.alt = "";
    newDiv.appendChild(newImg);

    if (targetContainer) {
      targetContainer.appendChild(newDiv);
    } else {
      document.querySelector(".grid-wrapper").appendChild(newDiv);
    }

    // 立即載入新圖片
    loadImage(newDiv, -1);

    return newDiv;
  };

  // 重新分類所有圖片功能
  window.reclassifyAllImages = function () {
    const containers = document.querySelectorAll(".grid-wrapper > div");
    containers.forEach((container) => {
      const img = container.querySelector("img");
      if (img && img.src && img.complete) {
        classifyImage(img, container);
      }
    });
  };
});
