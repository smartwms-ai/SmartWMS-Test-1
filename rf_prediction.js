
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
    const warnings = [];

    // Kiểm tra thiếu dữ liệu
    for (const key of featureNames) {
      if (
        row[key] === null ||
        row[key] === undefined ||
        row[key] === ""
      ) {
        errors.push(
          "Thiếu " + (labels[key] || key)
        );
      }
    }

    // Kiểm tra dữ liệu số
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

    // Kiểm tra công đoạn
    if (!
if (!Object.prototype.hasOwnProperty.call(stageNames, row.stage)) {
  errors.push("Công đoạn không hợp lệ");
}
) {
      errors.push("Công đoạn không hợp lệ");
    }

    // Kiểm tra biến phân loại
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
          !model.categories[index].includes(
            String(row[key])
          )
        ) {
          errors.push(
            "Giá trị chưa được huấn luyện: " + key
          );
        }
      });
    }

    
    return { errors, warnings };
  }

  function render() {
    if (!target) return;

    target.replaceChildren();

    const model =
      window.WmsRF && window.WmsRF.model;

    const rows = window.WmsRFInputs;

    if (!model) {
      target.appendChild(
        element(
          "p",
          "Đang tải mô hình Random Forest..."
        )
      );
      return;
    }

    if (!Array.isArray(rows) || !rows.length) {
      target.appendChild(
        element(
          "p",
          "Chưa có dữ liệu đầu vào từ WMS."
        )
      );
      return;
    }

    rows.forEach(row => {
      const card = element("div", "");

      card.style.cssText =
        "border:1px solid #dbe4ef;" +
        "border-radius:12px;" +
        "padding:16px;" +
        "margin-bottom:12px";

      card.appendChild(
        element(
          "h3",
          stageNames[row.stage] || row.stage
        )
      );

      const { errors, warnings } =
        validate(row, model);

      if (errors.length) {
        card.appendChild(
          element(
            "p",
            "Chưa đủ dữ liệu hợp lệ để dự báo."
          )
        );

        card.appendChild(
          element(
            "p",
            errors.join("; "),
            "card-note"
          )
        );

      } else {
        try {
          const minutes =
            window.WmsRF.predict(row);

          if (!Number.isFinite(minutes)) {
            throw new Error(
              "Kết quả không phải số hợp lệ"
            );
          }

          card.appendChild(
            element(
              "h2",
              minutes.toFixed(2) + " phút"
            )
          );

          // Cảnh báo dữ liệu ngoài phạm vi
          const note = element(
  "p",
  "Dự báo từ mô hình Random Forest v2. " +
  "Đầu vào đã qua kiểm tra định dạng và danh mục, " +
  "nhưng chưa xác minh phạm vi phân phối dữ liệu huấn luyện. " +
  "Kết quả chỉ phục vụ mô phỏng.",
  "card-note"
);

note.style.color = "#475569";
card.appendChild(note);

          // Thông tin nguồn dữ liệu
          card.appendChild(
            element(
              "p",
              "Lưu ý: order_count được suy ra " +
              "từ phiếu/đơn nghiệp vụ WMS, " +
              "chưa xác minh hoàn toàn tương đương " +
              "dữ liệu SQL. Pallet, thiết bị, " +
              "ca và độ phức tạp là cấu hình " +
              "kịch bản do người dùng nhập.",
              "card-note"
            )
          );

        } catch (error) {
          card.appendChild(
            element(
              "p",
              "Không thể dự báo: " +
              error.message
            )
          );
        }
      }

      target.appendChild(card);
    });
  }

  async function init() {
    if (!target) return;

    try {
      if (!window.WmsRF) {
        throw new Error(
          "Chưa nạp rf_browser.js"
        );
      }

      if (!window.WmsRF.model) {
        await window.WmsRF.load();
      }

      render();

    } catch (error) {
      target.textContent =
        "Lỗi tải mô hình: " +
        error.message;
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
