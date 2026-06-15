# 🚲 大臺北 YouBike 2.0 智慧調度與空間監控面板
**(Spatio-Operational Dispatch Dashboard)**

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](<替換成你的_Colab_分享連結>)

> **黑客松提案標語：** 從「被動救火」到「主動佈署」，透過空間聚類與即時數據融合，重新定義大臺北都會區的自行車調度戰略。

---

## ⚠️ 1. 痛點分析 (Pain Point Analysis)
傳統的公共自行車調度面臨三大核心困境：
1. **邊界效應 (Boundary Effect)：** 新北市與臺北市的通勤圈高度重疊，若僅分析單一行政區，跨橋借還的車輛會成為系統盲區，無法掌握真實的潮汐流動。
2. **被動救火 (Reactive Dispatch)：** 現有系統僅提供當下數據，調度員往往在站點「已經空了」或「已經滿了」才收到通報，導致調度經常是亡羊補牢，而非防患未然。
3. **認知負荷過載 (Cognitive Overload)：** 雙北擁有超過 3,300 個站點，傳統地圖上密密麻麻的圖標，讓第一線人員無法快速識別「真正需要緊急處理的重災區」。

---

## 💡 2. 核心解決方案 (Core Solution)
本專案開發了一套輕量、即時且具備分析能力的監控儀表板，提供以下核心價值：
* **雙北資料無縫融合：** 打破行政區界線，將雙北 API 統一標準化，呈現真實的「大臺北生活圈」流動視角。
* **動態調度戰區 (K-Means Spatio-Operational Clustering)：** 放棄傳統粗糙的「行政區」分界，引入機器學習演算法，結合地理空間與即時負載率，動態切分出「極度缺車區」與「滿載溢出區」，實現跨區精準運補。
* **高風險站點告警 (Manage by Exception)：** 透過加權風險評分機制，自動化過濾出全網 Top 10 告警清單，降低調度員的搜尋成本。

---

## 🏗️ 3. 系統架構 (System Architecture)
本專案採用 Python 資料管線開發，並透過 Colab 進行快速原型驗證 (PoC)：

* **Data Ingestion (資料獲取層)：** * 介接新北市與臺北市 YouBike 2.0 開放資料即時 API。
  * 實作防禦性獲取機制，處理 API 回傳的不穩定性與 Schema 變動。
* **ETL & Feature Engineering (資料清洗與特徵工程)：** * 計算核心衍生特徵：**車輛負載率 (Load Factor)** = `可借車數 / 總車位數`。
  * 進行特徵對齊、離散化，並消除時區衝突 (Timezone Mismatch)。
* **Machine Learning (分析模型層)：** * 使用 `scikit-learn` 進行資料標準化 (StandardScaler) 與 K-Means 聚類分析。
* **Visualization (視覺化展示層)：** * 利用 `Plotly Express (WebGL)` 進行千級別散點的高效渲染與 Z-Order 優先權排序。

---

## 🔥 4. 技術亮點 (Technical Highlights)

### 🌟 亮點一：空間與營運狀態混合聚類 (Spatio-Operational Clustering)
不同於一般僅依賴經緯度的聚類，本專案將 `[緯度, 經度, 負載率]` 同時作為特徵送入模型。透過 `StandardScaler` 標準化，確保了「地理位移」與「營運狀態」在距離計算上具有同等影響力。這讓演算法能自動抓出**「地理位置相近且同樣處於缺車狀態」**的真實熱點，重新定義了 10 個動態調度戰區。

### 🌟 亮點二：視覺化 Z-Order 渲染優化
解決了地圖視覺化中常見的 Overplotting (過度繪製) 痛點。我們為站點定義了渲染優先權（紅色/橘色 > 綠色），確保在密集的市中心地圖上，異常的警戒站點必定會繪製在 HTML5 Canvas 的最上層，確保調度員一眼就能看見危機。

### 🌟 亮點三：強健的防禦性資料管線 (Robust Data Pipeline)
在處理真實世界串流數據時，實作了包含「幽靈站點過濾 (總車位 <= 0 避免除以零)」、「欄位動態映射 (Schema Alignment)」以及「系統與 API 時差獨立監控」等防錯機制，確保 Dashboard 不會因為政府 API 瞬間連線異常而崩潰。

---

## 🚀 5. 快速啟動 (Getting Started)
本專案目前封裝於 Google Colab 筆記本中，不需繁雜的環境設定即可運行：
1. 點擊上方的 [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)] 按鈕開啟專案。
2. 在選單列選擇 `執行階段 (Runtime)` -> `全部執行 (Run all)`。
3. 滾動至各個區塊，即可觀看即時渲染的大臺北都會區 YouBike 監控地圖與統計面板。

*(註：本資料為即時串接政府開放資料 API，執行結果將隨當下真實時間之車輛狀態而變動。)*

---

## 🔮 6. 未來展望 (Future Roadmap)
若未來投入正式生產環境，本專案可進行以下擴展：
1. **結合天氣特徵：** 整合中央氣象署 API，納入降雨機率作為預測參數。
2. **LSTM 時間序列預測：** 從即時監控跨入「預判未來」，利用深度學習預測未來 15~30 分鐘內的站點負載率。
3. **路線最佳化 (VRP)：** 結合目前算出的高風險熱點，輸出為貨車路徑規劃演算法的目標節點，給予司機最快的導航路線。
