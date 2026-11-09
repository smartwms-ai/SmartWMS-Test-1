
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

    const numericFeatures = [
        "waiting_tasks",
        "waiting_quantity",
        "employee_count",
        "sku_count",
        "pallet_count",
        "order_count",
        "active_equipment_count"
    ];

    const target = document.getElementById("rf-prediction-results");

    function makeElement(tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    function validate(row, model) {
        const errors = [];
        const warnings = [];

        for (const key of featureNames) {
            if (row[key] === null ||
                row[key] === undefined ||
                row[key] === "") {
                errors.push("Thiếu " + key);
            }
        }

        for (const key of numericFeatures) {
            const value = row[key];

            if (value === null || value === undefined ||
                value === "") continue;

            if (!Number.isFinite(Number(value)) ||
                Number(value) < 0) {
                errors.push("Giá trị không hợp lệ: " + key);
            }
        }

        model.categorical.forEach((key, index) => {
            if (row[key] === null ||
                row[key] === undefined) return;

            if (!model.categories[index].includes(String(row[key]))) {
                errors.push("Danh mục chưa được huấn luyện: " + key);
            }
        });

        // Cảnh báo về tính tương thích dữ liệu.
        // Đây KHÔNG phải phép kiểm tra phạm vi huấn luyện đầy đủ.
        warnings.push(
            "order_count đang được suy ra từ nghiệp vụ WMS; " +
            "chưa xác minh tương đương dữ liệu huấn luyện."
        );

        warnings.push(
            "Các biến pallet, thiết bị, ca và độ phức tạp " +
            "là đầu vào kịch bản do người dùng thiết lập."
        );

        if (Number(row.order_count) > 3) {
            warnings.push(
                "order_count lớn hơn 3, vượt mức đã quan sát " +
                "trong dữ liệu SQL được kiểm tra trước đó."
            );
        }

        return { errors, warnings };
    }

    function render() {
        if (!target) return;

        target.replaceChildren();

        const model = window.WmsRF?.model;
        const rows = window.WmsRFInputs;

        if (!model) {
            target.appendChild(makeElement(
                "p",
                "Đang tải mô hình Random Forest..."
            ));
            return;
        }

        if (!Array.isArray(rows) || rows.length === 0) {
            target.appendChild(makeElement(
                "p",
                "Chưa có dữ liệu đầu vào từ WMS."
            ));
            return;
        }

        for (const row of rows) {
            const card = makeElement("div", "");
            card.style.border = "1px solid #dbe4ef";
            card.style.borderRadius = "12px";
            card.style.padding = "16px";
            card.style.marginBottom = "12px";

            card.appendChild(makeElement(
                "h3",
                stageNames[row.stage] || row.stage
            ));

            const { errors, warnings } = validate(row, model);

            if (errors.length) {
                card.appendChild(makeElement(
                    "p",
                    "Chưa đủ dữ liệu để dự báo."
                ));

                card.appendChild(makeElement(
                    "p",
                    errors.join("; "),
                    "card-note"
                ));
            } else {
                try {
                    const minutes = window.WmsRF.predict(row);

                    card.appendChild(makeElement(
                        "h2",
                        minutes.toFixed(2) + " phút"
                    ));

                    card.appendChild(makeElement(
                        "p",
                        "Dự báo thử nghiệm từ Random Forest Regression.",
                        "card-note"
                    ));

                    const warning = makeElement(
                        "p",
                        "Lưu ý: " + warnings.join(" "),
                        "card-note"
                    );
                    warning.style.color = "#a16207";
                    card.appendChild(warning);

                } catch (error) {
                    card.appendChild(makeElement(
                        "p",
                        "Không thể dự báo: " + error.message
                    ));
                }
            }

            target.appendChild(card);
        }
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

    window.addEventListener("rf:inputs-updated", render);
    window.addEventListener("rf:config-change", render);

    init();
})();
