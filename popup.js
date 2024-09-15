document.addEventListener('DOMContentLoaded', () => {
  const sortByDiscountTab = document.getElementById('sort-discount');
  const sortByOriginalTab = document.getElementById('sort-original');
  const resultDiv = document.getElementById('results');

  let originalResults = []; // 保存原始順序的結果
  let sortedByDiscount = []; // 保存按折扣排序的結果

  // 初始化頁面，預設按折扣排序
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab) {
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: extractWishlistResults
      }, (results) => {
        if (results && results[0].result) {
          originalResults = results[0].result;
          sortedByDiscount = sortResultsByDiscount(originalResults);
          resultDiv.innerHTML = renderResults(sortedByDiscount);
        } else {
          resultDiv.innerHTML = 'No results found.';
        }
      });
    }
  });

  // Tab 點擊事件
  sortByDiscountTab.addEventListener('click', () => {
    toggleTab(sortByDiscountTab, sortByOriginalTab);
    resultDiv.innerHTML = renderResults(sortedByDiscount);
  });

  sortByOriginalTab.addEventListener('click', () => {
    toggleTab(sortByOriginalTab, sortByDiscountTab);
    resultDiv.innerHTML = renderResults(originalResults);
  });

  // 切換Tab樣式
  function toggleTab(activeTab, inactiveTab) {
    activeTab.classList.add('active');
    inactiveTab.classList.remove('active');
  }

  // 排序結果函數
  function sortResultsByDiscount(results) {
    return [...results].sort((a, b) => (a[3] !== null ? a[3] : Infinity) - (b[3] !== null ? b[3] : Infinity));
  }

  // 顯示結果的函數
  function renderResults(results) {
    return results.map(result => {
      return `<div>
                <h3>${result[0]}</h3>
                <p>原價：${result[1] || 'N/A'} 元</p>
                <p>特價：${result[2] || 'N/A'} 元</p>
                <p>折數：${result[3] ? (result[3] * 100).toFixed(2) + '%' : 'N/A'}</p>
              </div>`;
    }).join('');
  }
});

// 提取願望清單數據的函數
function extractWishlistResults() {
  const elements = document.querySelectorAll('#wishlist_product');
  const results = [];

  elements.forEach(element => {
    let text = element.innerText.trim();
    let itemString = '';

    if (text) {
      const lines = text.split('\n');
      itemString = lines[1]?.trim() || '';

      if (itemString === '') {
        const bookNameElement = element.querySelector('h4.bookname_cart');
        itemString = bookNameElement ? bookNameElement.innerText.trim() : '';
      }

      // 判斷商品名稱是否為 "AAA"，如果是，將原價替換為40元
      let originalPrice = null;
      if (itemString.includes('我的口交同學(')) { // 此商品無優惠時標示為原價160，特價40
        originalPrice = 40;  // 替換原價為40元
      } else {
        const priceMatch = text.match(/原價：\s*(\d+)\s*元/);
        originalPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;
      }

      const saleMatch = text.match(/特價：\s*(\d+)\s*元/);
      const salePrice = saleMatch ? parseInt(saleMatch[1], 10) : null;

      const ratio = (originalPrice !== null && salePrice !== null) ? (salePrice / originalPrice) : null;

      results.push([itemString, originalPrice, salePrice, ratio]);
    }
  });

  return results;
}
