
(function () {
    "use strict";

    const STORAGE_KEY = "smartwms:rf-config:v1";

    const stages = [
        ["receiving", "Nhận hàng"],
        ["putaway", "Cất hàng"],
        ["picking", "Lấy hàng"],
        ["packing", "Đóng gói"],
        ["shipping", "Xuất hàng"]
    ];

    const fields = [
        {
            key: "pallet_count",
            label: "Số pallet",
            type: "number",
            min: 0
        },
        {
            key: "active_equipment_count",
            label: "Thiết bị đang hoạt động",
            type: "number",
            min: 0
        },
        {
            key: "shift",
            label: "Ca làm việc",
            type: "select",
            categoryIndex: 1
        },
        {
            key: "complexity_level",
            label: "Độ phức tạp",
            type: "select",
            categoryIndex: 2
        }
    ];

    function read() {
        try {
            const value = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "{}"
            );
            return value && typeof value === "object"
                ? value
                : {};
        } catch {
            return {};
        }
    }

    function save(data) {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
        window.dispatchEvent(
            new Event("rf:config-change")
        );
    }

    function get(stage) {
        return read()[stage] || {};
    }

    function render() {
        const target = document.getElementById(
            "rf-config-container"
        );

        if (!target) return;

        target.replaceChildren();

        const heading = document.createElement("h2");
        heading.textContent = "Cấu hình vận hành AI";
        target.appendChild(heading);

        const note = document.createElement("p");
        note.className = "card-note";
        note.textContent =
            "Nhập điều kiện vận hành cho từng công đoạn. " +
            "Đây là dữ liệu kịch bản do người dùng thiết lập, " +
            "không phải dữ liệu WMS tự động thu thập.";
        target.appendChild(note);

        const form = document.createElement("form");
        form.id = "rf-scenario-form";

        const tableWrap = document.createElement("div");
        tableWrap.className = "table-wrap";

        const table = document.createElement("table");
        table.style.width = "100%";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        ["Công đoạn", ...fields.map(f => f.label)]
            .forEach(label => {
                const th = document.createElement("th");
                th.textContent = label;
                headerRow.appendChild(th);
            });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const current = read();

        for (const [stage, stageLabel] of stages) {
            const tr = document.createElement("tr");
            const name = document.createElement("td");
            name.textContent = stageLabel;
            tr.appendChild(name);

            for (const field of fields) {
                const td = document.createElement("td");
                let control;

                if (field.type === "select") {
                    control = document.createElement("select");

                    const empty = document.createElement("option");
                    empty.value = "";
                    empty.textContent = "Chọn...";
                    control.appendChild(empty);

                    const categories =
                        window.WmsRF?.model?.categories?.[
                            field.categoryIndex
                        ] || [];

                    categories.forEach(value => {
                        const option =
                            document.createElement("option");
                        option.value = value;
                        option.textContent = value;
                        control.appendChild(option);
                    });

                } else {
                    control = document.createElement("input");
                    control.type = "number";
                    control.min = String(field.min);
                    control.step = "1";
                    control.placeholder = "Chưa nhập";
                }

                control.name = stage + ":" + field.key;
                control.style.width = "100%";
                control.style.minWidth = "105px";
                control.style.padding = "8px";

                const previous = current[stage]?.[field.key];

                if (previous !== undefined &&
                    previous !== null) {
                    control.value = String(previous);
                }

                td.appendChild(control);
                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        tableWrap.appendChild(table);
        form.appendChild(tableWrap);

        const button = document.createElement("button");
        button.type = "submit";
        button.className = "btn";
        button.textContent = "Lưu cấu hình AI";
        button.style.marginTop = "16px";
        form.appendChild(button);
        if (document.getElementById("scenario-capacity-form")) {
            button.hidden = true;
            button.setAttribute("aria-hidden", "true");
        }

        const message = document.createElement("p");
        message.className = "card-note";
        message.setAttribute("role", "status");
        form.appendChild(message);

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const data = {};

            for (const [stage] of stages) {
                data[stage] = {};

                for (const field of fields) {
                    const control = form.elements.namedItem(
                        stage + ":" + field.key
                    );

                    const raw = control.value.trim();

                    if (raw === "") {
                        data[stage][field.key] = null;
                        continue;
                    }

                    if (field.type === "number") {
                        const value = Number(raw);

                        if (!Number.isSafeInteger(value) ||
                            value < field.min) {
                            message.textContent =
                                "Vui lòng nhập số nguyên không âm.";
                            return;
                        }

                        data[stage][field.key] = value;
                    } else {
                        data[stage][field.key] = raw;
                    }
                }
            }

            save(data);
            message.textContent =
                "Đã lưu cấu hình kịch bản AI trên trình duyệt.";
        });

        target.appendChild(form);
    }

    async function init() {
        try {
            if (!window.WmsRF) {
                throw new Error(
                    "Chưa tải thư viện Random Forest."
                );
            }

            await window.WmsRF.load();
            render();

        } catch (error) {
            console.error("Lỗi cấu hình RF:", error);

            const target = document.getElementById(
                "rf-config-container"
            );

            if (target) {
                target.textContent =
                    "Không thể tải cấu hình AI: " +
                    error.message;
            }
        }
    }

    window.RFConfig = {
        get,
        read,
        save,
        render
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }
})();
