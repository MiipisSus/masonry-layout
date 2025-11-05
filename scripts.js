// 圖片尺寸分類腳本
document.addEventListener("DOMContentLoaded", function () {
  // 取得所有包含圖片的 div 容器
  const imageContainers = document.querySelectorAll(".grid-wrapper > div");
  let processedCount = 0;

  imageContainers.forEach((container, index) => {
    const img = container.querySelector("img");

    if (img) {
      // 清除所有現有的 class
      container.className = "";

      // 等待圖片載入完成
      if (img.complete) {
        classifyImage(img, container);
        processedCount++;
      } else {
        img.onload = function () {
          classifyImage(img, container);
          processedCount++;
        };

        img.onerror = function () {
          container.classList.add("error");
          processedCount++;
        };
      }
    }
  });

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
      container.classList.add(imageType);
    }
  }

  // 新增圖片功能（動態添加圖片時使用）
  window.addNewImage = function (imageSrc, targetContainer) {
    const newDiv = document.createElement("div");
    const newImg = document.createElement("img");

    newImg.src = imageSrc;
    newImg.alt = "";
    newDiv.appendChild(newImg);

    if (targetContainer) {
      targetContainer.appendChild(newDiv);
    } else {
      document.querySelector(".grid-wrapper").appendChild(newDiv);
    }

    // 為新圖片分類
    newImg.onload = function () {
      classifyImage(newImg, newDiv);
    };

    return newDiv;
  };

  // 重新分類所有圖片功能
  window.reclassifyAllImages = function () {
    const containers = document.querySelectorAll(".grid-wrapper > div");
    containers.forEach((container) => {
      // 清除現有的尺寸相關 class
      container.classList.remove("wide", "tall", "big", "error");

      const img = container.querySelector("img");
      if (img && img.complete) {
        classifyImage(img, container);
      }
    });
  };
});
