
(async function () {
  "use strict";

  const panel = document.getElementById("rf-evaluation-panel");
  if (!panel) return;

  const STAGES = {
    RECEIVING: "Nhận hàng",
    PUTAWAY: "Cất hàng",
    PICKING: "Lấy hàng",
    PACKING: "Đóng gói",
    SHIPPING: "Xuất hàng"
  };

  const FEATURE_NAMES = {
    num__waiting_quantity: "Số lượng hàng chờ",
    num__waiting_tasks: "Số công việc chờ",
    num__pallet_count: "Số pallet",
    num__order_count: "Số đơn hàng",
    num__sku_count: "Số SKU",
    num__employee_count: "Số nhân viên",
    num__active_equipment_count: "Thiết bị hoạt động",
    cat__stage_RECEIVING: "Công đoạn Nhận hàng",
    cat__stage_PUTAWAY: "Công đoạn Cất hàng",
    cat__stage_PICKING: "Công đoạn Lấy hàng",
    cat__stage_PACKING: "Công đoạn Đóng gói",
    cat__stage_SHIPPING: "Công đoạn Xuất hàng",
    cat__shift_MORNING: "Ca sáng",
    cat__shift_AFTERNOON: "Ca chiều",
    cat__shift_NIGHT: "Ca đêm",
    cat__complexity_level_LOW: "Độ phức tạp thấp",
    cat__complexity_level_MEDIUM: "Độ phức tạp trung bình",
    cat__complexity_level_HIGH: "Độ phức tạp cao"
  };

  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };

  const fmt = (n, digits = 2) =>
    Number(n).toLocaleString("vi-VN", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });

  const css = `
    #rf-evaluation-panel .rfv-head {
      margin-bottom: 20px;
    }

    #rf-evaluation-panel .rfv-subtitle {
      color: #64748b;
      font-size: 13px;
      line-height: 1.7;
      margin-top: 8px;
    }

    #rf-evaluation-panel .rfv-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin: 22px 0;
    }

    #rf-evaluation-panel .rfv-metric {
      border: 1px solid #dbe4ef;
      border-radius: 14px;
      background: #fff;
      padding: 20px;
      min-width: 0;
    }

    #rf-evaluation-panel .rfv-metric-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
    }

    #rf-evaluation-panel .rfv-metric-value {
      color: #17365d;
      font-size: 27px;
      font-weight: 750;
      margin: 12px 0 6px;
      overflow-wrap: anywhere;
    }

    #rf-evaluation-panel .rfv-metric-note {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
    }

    #rf-evaluation-panel .rfv-section {
      background: #fff;
      border: 1px solid #dbe4ef;
      border-radius: 14px;
      padding: 22px;
      margin-top: 20px;
    }

    #rf-evaluation-panel .rfv-section h3 {
      margin: 0;
      color: #17365d;
      font-size: 18px;
    }

    #rf-evaluation-panel .rfv-section-note {
      margin: 8px 0 20px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.7;
    }

    #rf-evaluation-panel .rfv-feature {
      margin-bottom: 16px;
    }

    #rf-evaluation-panel .rfv-feature-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 7px;
      font-size: 13px;
    }

    #rf-evaluation-panel .rfv-feature-name {
      color: #334155;
    }

    #rf-evaluation-panel .rfv-feature-value {
      font-weight: 700;
      color: #17365d;
      white-space: nowrap;
    }

    #rf-evaluation-panel .rfv-track {
      height: 10px;
      background: #e9eef5;
      border-radius: 999px;
      overflow: hidden;
    }

    #rf-evaluation-panel .rfv-fill {
      height: 100%;
      border-radius: 999px;
      background: #2563eb;
    }

    #rf-evaluation-panel .rfv-button {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 9px;
      padding: 10px 15px;
      color: #1d4ed8;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
    }

    #rf-evaluation-panel .rfv-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin: 18px 0;
    }

    #rf-evaluation-panel .rfv-select {
      padding: 11px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 9px;
      background: #fff;
      min-width: 170px;
      font: inherit;
    }

    #rf-evaluation-panel .rfv-stage-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 14px 0 22px;
    }

    #rf-evaluation-panel .rfv-stat {
      padding: 10px 14px;
      border-radius: 9px;
      background: #f1f5f9;
      font-size: 13px;
      color: #334155;
    }

    #rf-evaluation-panel .rfv-stat strong {
      color: #17365d;
    }

    #rf-evaluation-panel .rfv-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin: 14px 0 20px;
      color: #475569;
      font-size: 13px;
    }

    #rf-evaluation-panel .rfv-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }

    #rf-evaluation-panel .rfv-record {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      background: #fff;
    }

    #rf-evaluation-panel .rfv-record-head {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 15px;
      font-size: 13px;
    }

    #rf-evaluation-panel .rfv-error {
      color: #64748b;
      font-size: 12px;
    }

    #rf-evaluation-panel .rfv-bar-row {
      display: grid;
      grid-template-columns: 85px minmax(0, 1fr) 90px;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
      font-size: 12px;
    }

    #rf-evaluation-panel .rfv-bar-label {
      color: #64748b;
    }

    #rf-evaluation-panel .rfv-bar-value {
      font-weight: 700;
      text-align: right;
      color: #334155;
    }

    #rf-evaluation-panel .rfv-actual {
      background: #2563eb;
    }

    #rf-evaluation-panel .rfv-predicted {
      background: #f59e0b;
    }

    #rf-evaluation-panel .rfv-warning {
      padding: 15px;
      border-radius: 10px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 13px;
      line-height: 1.7;
      margin-top: 20px;
    }

    @media (max-width: 650px) {
      #rf-evaluation-panel .rfv-metrics {
        grid-template-columns: 1fr;
      }

      #rf-evaluation-panel .rfv-section {
        padding: 15px;
      }

      #rf-evaluation-panel .rfv-bar-row {
        grid-template-columns: 65px minmax(0, 1fr) 72px;
        gap: 6px;
      }

      #rf-evaluation-panel .rfv-metric-value {
        font-size: 24px;
      }
    }
  `;

  try {
    const response = await fetch(
      "rf_verified_evaluation.json?v=1",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Không tải được rf_verified_evaluation.json");
    }

    const data = await response.json();

    if (
      !data.metrics ||
      !Array.isArray(data.test_predictions) ||
      data.test_predictions.length !== 30 ||
      !Array.isArray(data.feature_importance)
    ) {
      throw new Error("Dữ liệu đánh giá không hợp lệ");
    }

    const rows = data.test_predictions;

    for (const row of rows) {
      if (
        !Number.isFinite(row.actual_minutes) ||
        !Number.isFinite(row.predicted_minutes)
      ) {
        throw new Error("Có bản ghi kiểm thử không hợp lệ");
      }
    }

    const mae = rows.reduce(
      (sum, row) =>
        sum + Math.abs(row.actual_minutes - row.predicted_minutes),
      0
    ) / rows.length;

    const rmse = Math.sqrt(
      rows.reduce(
        (sum, row) =>
          sum + Math.pow(
            row.actual_minutes - row.predicted_minutes,
            2
          ),
        0
      ) / rows.length
    );

    const mean = rows.reduce(
      (sum, row) => sum + row.actual_minutes,
      0
    ) / rows.length;

    const ssTotal = rows.reduce(
      (sum, row) =>
        sum + Math.pow(row.actual_minutes - mean, 2),
      0
    );

    const ssResidual = rows.reduce(
      (sum, row) =>
        sum + Math.pow(
          row.actual_minutes - row.predicted_minutes,
          2
        ),
      0
    );

    if (ssTotal === 0) {
      throw new Error("Không thể tính R²");
    }

    const r2 = 1 - ssResidual / ssTotal;

    if (
      Math.abs(mae - data.metrics.MAE_min) > 0.0001 ||
      Math.abs(rmse - data.metrics.RMSE_min) > 0.0001 ||
      Math.abs(r2 - data.metrics.R2) > 0.0001
    ) {
      throw new Error(
        "Chỉ số đánh giá không khớp 30 bản ghi kiểm thử"
      );
    }

    const style = el("style");
    style.textContent = css;
    document.head.appendChild(style);

    panel.replaceChildren();

    // TIÊU ĐỀ
    const header = el("div", undefined, "rfv-head");

    header.append(
      el(
        "h2",
        "Đánh giá chất lượng mô hình Random Forest"
      ),
      el(
        "p",
        "Kết quả được tính lại từ 30 bản ghi kiểm thử. " +
        "Dữ liệu lấy từ SQL và mô hình Random Forest đã huấn luyện. " +
        "Đây là đánh giá offline trên dữ liệu tổng hợp.",
        "rfv-subtitle"
      )
    );

    panel.appendChild(header);

    // 3 CHỈ SỐ
    const metrics = el("div", undefined, "rfv-metrics");

    const metricItems = [
      [
        "MAE",
        fmt(mae, 3) + " phút",
        "Sai số tuyệt đối trung bình"
      ],
      [
        "RMSE",
        fmt(rmse, 3) + " phút",
        "Sai số bình phương trung bình"
      ],
      [
        "R² Score",
        fmt(r2, 4),
        "Mức độ phù hợp trên tập kiểm thử"
      ]
    ];

    metricItems.forEach(([name, value, note]) => {
      const card = el("div", undefined, "rfv-metric");

      card.append(
        el("div", name, "rfv-metric-label"),
        el("div", value, "rfv-metric-value"),
        el("div", note, "rfv-metric-note")
      );

      metrics.appendChild(card);
    });

    panel.appendChild(metrics);

    // FEATURE IMPORTANCE
    const featureSection = el(
      "section",
      undefined,
      "rfv-section"
    );

    featureSection.append(
      el("h3", "Feature Importance"),
      el(
        "p",
        "Mức độ quan trọng của các đặc trưng được trích " +
        "từ mô hình .pkl. Thanh biểu đồ được chuẩn hóa " +
        "theo đặc trưng quan trọng nhất. " +
        "Các tỷ lệ phần trăm vẫn giữ nguyên giá trị thực.",
        "rfv-section-note"
      )
    );

    const featureList = el("div");

    const features = data.feature_importance
      .slice()
      .sort((a, b) => b.importance - a.importance);

    const maxImportance = Math.max(
      ...features.map(item => item.importance),
      0.000001
    );

    let showAllFeatures = false;

    function renderFeatures() {
      featureList.replaceChildren();

      const visible = showAllFeatures
        ? features
        : features.slice(0, 7);

      visible.forEach(item => {
        const wrapper = el(
          "div",
          undefined,
          "rfv-feature"
        );

        const head = el(
          "div",
          undefined,
          "rfv-feature-head"
        );

        const name =
          FEATURE_NAMES[item.feature] || item.feature;

        head.append(
          el("span", name, "rfv-feature-name"),
          el(
            "strong",
            fmt(item.importance * 100) + "%",
            "rfv-feature-value"
          )
        );

        const track = el(
          "div",
          undefined,
          "rfv-track"
        );

        const fill = el(
          "div",
          undefined,
          "rfv-fill"
        );

        fill.style.width =
          Math.max(
            0,
            Math.min(
              100,
              item.importance / maxImportance * 100
            )
          ) + "%";

        track.appendChild(fill);
        wrapper.append(head, track);
        featureList.appendChild(wrapper);
      });
    }

    renderFeatures();

    featureSection.appendChild(featureList);

    if (features.length > 7) {
      const toggle = el(
        "button",
        "Xem tất cả đặc trưng",
        "rfv-button"
      );

      toggle.type = "button";

      toggle.addEventListener("click", () => {
        showAllFeatures = !showAllFeatures;

        toggle.textContent = showAllFeatures
          ? "Thu gọn"
          : "Xem tất cả đặc trưng";

        renderFeatures();
      });

      featureSection.appendChild(toggle);
    }

    panel.appendChild(featureSection);

    // ACTUAL VS PREDICTED
    const comparisonSection = el(
      "section",
      undefined,
      "rfv-section"
    );

    comparisonSection.append(
      el("h3", "Actual vs Predicted"),
      el(
        "p",
        "So sánh thời gian xử lý thực tế và dự đoán " +
        "của Random Forest trên 30 bản ghi kiểm thử, " +
        "chia theo 5 công đoạn.",
        "rfv-section-note"
      )
    );

    const toolbar = el(
      "div",
      undefined,
      "rfv-toolbar"
    );

    const selectLabel = el(
      "label",
      "Chọn công đoạn:"
    );

    selectLabel.htmlFor = "rfv-stage-select";

    const select = el(
      "select",
      undefined,
      "rfv-select"
    );

    select.id = "rfv-stage-select";

    Object.entries(STAGES).forEach(([code, name]) => {
      const option = el("option", name);
      option.value = code;
      select.appendChild(option);
    });

    toolbar.append(selectLabel, select);
    comparisonSection.appendChild(toolbar);

    const stats = el(
      "div",
      undefined,
      "rfv-stage-stats"
    );

    comparisonSection.appendChild(stats);

    const legend = el(
      "div",
      undefined,
      "rfv-legend"
    );

    const actualLegend = el("span");
    const actualDot = el("span", undefined, "rfv-dot");
    actualDot.style.background = "#2563eb";
    actualLegend.append(
      actualDot,
      document.createTextNode("Thời gian thực tế")
    );

    const predictedLegend = el("span");
    const predictedDot = el("span", undefined, "rfv-dot");
    predictedDot.style.background = "#f59e0b";
    predictedLegend.append(
      predictedDot,
      document.createTextNode("AI dự đoán")
    );

    legend.append(actualLegend, predictedLegend);
    comparisonSection.appendChild(legend);

    const chart = el("div");
    comparisonSection.appendChild(chart);

    function makeBarRow(label, value, max, type) {
      const row = el(
        "div",
        undefined,
        "rfv-bar-row"
      );

      const name = el(
        "span",
        label,
        "rfv-bar-label"
      );

      const track = el(
        "div",
        undefined,
        "rfv-track"
      );

      const fill = el(
        "div",
        undefined,
        "rfv-fill " + type
      );

      fill.style.width =
        Math.max(0, Math.min(100, value / max * 100)) + "%";

      track.appendChild(fill);

      const number = el(
        "strong",
        fmt(value) + " phút",
        "rfv-bar-value"
      );

      row.append(name, track, number);

      return row;
    }

    function renderComparison() {
      const filtered = rows.filter(
        row => row.stage === select.value
      );

      chart.replaceChildren();
      stats.replaceChildren();

      if (!filtered.length) {
        chart.appendChild(
          el("p", "Không có bản ghi kiểm thử.")
        );
        return;
      }

      const stageMae = filtered.reduce(
        (sum, row) =>
          sum + Math.abs(
            row.actual_minutes - row.predicted_minutes
          ),
        0
      ) / filtered.length;

      const statItems = [
        ["Số bản ghi", String(filtered.length)],
        ["MAE công đoạn", fmt(stageMae) + " phút"]
      ];

      statItems.forEach(([name, value]) => {
        const item = el(
          "div",
          undefined,
          "rfv-stat"
        );

        item.append(
          document.createTextNode(name + ": "),
          el("strong", value)
        );

        stats.appendChild(item);
      });

      const max = Math.max(
        ...filtered.flatMap(row => [
          row.actual_minutes,
          row.predicted_minutes
        ]),
        1
      ) * 1.05;

      filtered.forEach(row => {
        const card = el(
          "div",
          undefined,
          "rfv-record"
        );

        const head = el(
          "div",
          undefined,
          "rfv-record-head"
        );

        const difference = Math.abs(
          row.actual_minutes - row.predicted_minutes
        );

        head.append(
          el(
            "strong",
            "Bản ghi #" + row.workload_id
          ),
          el(
            "span",
            "Sai lệch: " + fmt(difference) + " phút",
            "rfv-error"
          )
        );

        card.append(
          head,
          makeBarRow(
            "Thực tế",
            row.actual_minutes,
            max,
            "rfv-actual"
          ),
          makeBarRow(
            "Dự đoán",
            row.predicted_minutes,
            max,
            "rfv-predicted"
          )
        );

        chart.appendChild(card);
      });
    }

    select.addEventListener(
      "change",
      renderComparison
    );

    renderComparison();

    panel.appendChild(comparisonSection);

    // PHƯƠNG PHÁP & GIỚI HẠN
    const warning = el(
      "div",
      "Phương pháp: 150 bản ghi tổng hợp, " +
      "120 bản ghi huấn luyện được báo cáo và " +
      "30 bản ghi kiểm thử (6 bản ghi cuối theo thời gian " +
      "ở mỗi công đoạn). Các chỉ số được tính lại từ " +
      "30 cặp dự đoán. Chưa xác minh độc lập toàn bộ " +
      "quy trình huấn luyện hoặc loại trừ rò rỉ dữ liệu. " +
      "Kết quả chưa chứng minh khả năng áp dụng cho kho thực tế.",
      "rfv-warning"
    );

    panel.appendChild(warning);

  } catch (error) {
    console.error(
      "Lỗi đánh giá Random Forest:",
      error
    );

    panel.replaceChildren();

    panel.appendChild(
      el(
        "p",
        "Không thể hiển thị kết quả đánh giá: " +
        error.message
      )
    );
  }
})();
