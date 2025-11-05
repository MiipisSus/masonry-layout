// 圖片尺寸分類腳本 - 分批載入顯示版本
document.addEventListener("DOMContentLoaded", function () {
  // 配置參數
  const BATCH_SIZE = 20; // 每批載入圖片數量（可調整）
  const SCROLL_THRESHOLD = 300; // 滾動觸發閾值（像素）

  // 顯示整頁loading效果
  showPageLoading();

  // 取得所有包含圖片的 div 容器
  const imageContainers = document.querySelectorAll(".grid-wrapper > div");
  let currentBatchIndex = 0;
  let isLoadingBatch = false;

  // 初始化所有容器為隱藏狀態
  imageContainers.forEach((container, index) => {
    const img = container.querySelector("img");
    if (img) {
      // 儲存原始 src，並清空 src 以防止自動載入
      img.dataset.src = img.src;
      img.src = "";
      container.style.display = "none"; // 隱藏未載入的圖片
    }
  });

  // 載入第一批圖片
  loadBatch(0); // 設置滾動監聽器
  let scrollTimeout;
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 100);
  });

  // 處理滾動事件
  function handleScroll() {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 當滾動到接近底部且沒有正在載入時，載入下一批
    if (
      scrollPosition >= documentHeight - SCROLL_THRESHOLD &&
      !isLoadingBatch &&
      currentBatchIndex * BATCH_SIZE < imageContainers.length
    ) {
      loadBatch(currentBatchIndex);
    }
  }

  // 載入一批圖片
  function loadBatch(batchIndex) {
    if (isLoadingBatch) return;

    isLoadingBatch = true;

    // 顯示批次載入指示器（非第一批時）
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

    // 收集此批次的容器
    for (let i = startIndex; i < endIndex; i++) {
      batchContainers.push(imageContainers[i]);
    }

    // 載入此批次的所有圖片
    batchContainers.forEach((container, index) => {
      loadImage(container, () => {
        batchLoadedCount++;
        // 當此批次所有圖片載入完成時，一起顯示
        if (batchLoadedCount === batchSize) {
          showBatch(batchContainers);
          isLoadingBatch = false;
          currentBatchIndex++;

          // 隱藏批次載入指示器
          hideBatchLoading();

          // 如果是第一批，隱藏整頁loading
          if (batchIndex === 0) {
            hidePageLoading();
          }
        }
      });
    });
  }

  // 載入單張圖片
  function loadImage(container, onComplete) {
    const img = container.querySelector("img");

    if (img && img.dataset.src) {
      // 建立新的圖片物件來預載入
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

  // 顯示一批圖片
  function showBatch(containers) {
    containers.forEach((container, index) => {
      setTimeout(() => {
        container.style.display = "flex";
        container.classList.add("batch-reveal");
      }, index * 50); // 錯開顯示時間，營造動畫效果
    });
  }

  // 檢查初始載入是否完成
  function checkInitialLoadComplete() {
    hidePageLoading();
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

  // 顯示批次載入指示器
  function showBatchLoading() {
    // 避免重複建立
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

  // 隱藏批次載入指示器
  function hideBatchLoading() {
    const batchLoadingIndicator = document.getElementById("batch-loading");
    if (batchLoadingIndicator) {
      batchLoadingIndicator.style.opacity = "0";
      setTimeout(() => {
        batchLoadingIndicator.remove();
      }, 300);
    }
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

    // 立即載入新圖片並顯示
    loadImage(newDiv, () => {
      showBatch([newDiv]);
    });

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

  // 手動載入下一批圖片
  window.loadNextBatch = function () {
    if (
      !isLoadingBatch &&
      currentBatchIndex * BATCH_SIZE < imageContainers.length
    ) {
      loadBatch(currentBatchIndex);
    }
  };

  // 修改批次大小
  window.setBatchSize = function (newSize) {
    if (newSize > 0) {
      // 注意：這裡無法修改const變數，這個函式主要用於提醒
      console.log(
        `當前批次大小：${BATCH_SIZE}，如需修改請在腳本頂部修改 BATCH_SIZE 變數`
      );
    }
  };
});
