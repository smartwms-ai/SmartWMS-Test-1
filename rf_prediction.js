
(function () {
  "use strict";

  const stageNames = {
    RECEIVING: "Nhận hàng",
    PUTAWAY: "Cất hàng",
    PICKING: "Lấy hàng",
    PACKING: "Đóng gói",
    SHIPPING: "Xuất hàng"
  };

  const featureNames = [
    "stage",
    "waiting_tasks",
    "waiting_quantity",
    "employee_count",
    "sku_count",
    "pallet_count",
    "order_count",
    "active_equipment_count",
    "shift",
    "complexity_level"
  ];

  const numericFeatures = featureNames.filter(
    key => !["stage", "shift", "complexity_level"].includes(key)
  );

  const labels = {
    waiting_tasks: "Số công việc chờ",
    waiting_quantity: "Số lượng chờ",
    employee_count: "Số nhân viên",
    sku_count: "Số SKU",
    pallet_count: "Số pallet",
    order_count: "Số đơn/phiếu",
    active_equipment_count: "Thiết bị hoạt động"
  };

  const target = document.getElementById(
    "rf-prediction-results"
  );

  function element(tag, content, className) {
    const node = document.createElement(tag);
    node.textContent = content;

    if (className) {
      node.className = className;
    }

    return node;
  }

  function validate(row, model) {
    const errors = [];

    for (const key of featureNames) {
      if (
        row[key] === null ||
        row[key] === undefined ||
        row[key] === ""
      ) {
        errors.push("Thiếu " + (labels[key] || key));
      }
    }

    for (const key of numericFeatures) {
      const value = row[key];

      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        continue;
      }

      if (
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      ) {
        errors.push(
          "Giá trị không hợp lệ: " +
          (labels[key] || key)
        );
      }
    }

    if (!Object.prototype.hasOwnProperty.call(stageNames, row.stage)) {
      errors.push("Công đoạn không hợp lệ");
    }

    if (
      Array.isArray(model.categorical) &&
      Array.isArray(model.categories)
    ) {
      model.categorical.forEach((key, index) => {
        if (
          row[key] === null ||
          row[key] === undefined ||
          row[key] === ""
        ) {
          return;
        }

        if (
          !Array.isArray(model.categories[index]) ||
          !model.categories[index].includes(String(row[key]))
        ) {
          errors.push(
            "Giá trị chưa được huấn luyện: " + key
          );
        }
      });
    }

    return errors;
  }

  function render() {
    if (!target) return;

    target.replaceChildren();

    const model = window.WmsRF && window.WmsRF.model;
    const rows = window.WmsRFInputs;

    if (!model) {
      target.appendChild(
        element("p", "Đang tải mô hình Random Forest...")
      );
      return;
    }

    if (!Array.isArray(rows) || !rows.length) {
      target.appendChild(
        element("p", "Chưa có dữ liệu đầu vào từ WMS.")
      );
      return;
    }

    rows.forEach(row => {
      const card = element("div", "");

      card.style.cssText = [
        "border:1px solid #dbe4ef",
        "border-radius:14px",
        "padding:20px",
        "margin-bottom:14px",
        "background:#ffffff"
      ].join(";");

      const heading = element(
        "h3",
        stageNames[row.stage] || row.stage
      );

      heading.style.cssText =
        "margin:0 0 14px;color:#1d4267;font-size:18px";

      card.appendChild(heading);

      const errors = validate(row, model);

      if (errors.length) {
        const message = element(
          "p",
          "Chưa đủ dữ liệu hợp lệ để dự báo."
        );

        message.style.cssText =
          "margin:0 0 8px;color:#475569;font-size:14px";

        card.appendChild(message);

        const detail = element(
          "p",
          errors.join("; ")
        );

        detail.style.cssText =
          "margin:0;color:#b45309;font-size:12px";

        card.appendChild(detail);

      } else {
        try {
          const minutes = window.WmsRF.predict(row);

          if (!Number.isFinite(minutes)) {
            throw new Error("Kết quả không phải số hợp lệ");
          }

          const result = element(
            "h2",
            minutes.toFixed(2) + " phút"
          );

          result.style.cssText = [
            "margin:0",
            "font-size:28px",
            "font-weight:800",
            "color:#1d4267"
          ].join(";");

          card.appendChild(result);

        } catch (error) {
          const message = element(
            "p",
            "Không thể dự báo: " + error.message
          );

          message.style.color = "#b91c1c";
          card.appendChild(message);
        }
      }

      target.appendChild(card);
    });
  }

  async function init() {
    if (!target) return;

    try {
      if (!window.WmsRF) {
        throw new Error("Chưa nạp rf_browser.js");
      }

      if (!window.WmsRF.model) {
        await window.WmsRF.load();
      }

      render();

    } catch (error) {
      target.textContent =
        "Lỗi tải mô hình: " + error.message;
    }
  }

  window.addEventListener(
    "rf:inputs-updated",
    render
  );

  window.addEventListener(
    "rf:config-change",
    render
  );

  init();
})();
