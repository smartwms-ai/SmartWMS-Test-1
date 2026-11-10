(function () {
  "use strict";
  const names = {receiving:"Nhận hàng",putaway:"Cất hàng",picking:"Lấy hàng",packing:"Đóng gói",shipping:"Xuất hàng"};
  const fields = ["pallet_count","active_equipment_count","shift","complexity_level"];
  const $ = id => document.getElementById(id);
  function fill() {
    try {
      const stage = $("scenario-stage").value;
      const item = WmsDemo.analysis().find(x => x.stage === stage);
      if (!item) return;
      $("scenario-workers").value = item.workers;
      $("scenario-per-hour").value = item.perHour;
    } catch (error) { $("scenario-capacity-status").textContent = "Không đọc được năng lực: " + error.message; }
  }
  function collectAI() {
    const form = $("rf-scenario-form");
    if (!form || !window.RFConfig) throw new Error("Cấu hình AI chưa tải xong, hãy thử lại.");
    const data = {};
    for (const stage of Object.keys(names)) {
      data[stage] = {};
      for (const field of fields) {
        const input = form.elements.namedItem(stage + ":" + field);
        if (!input) throw new Error("Thiếu trường cấu hình " + field);
        const raw = input.value.trim();
        if (field === "pallet_count" || field === "active_equipment_count") {
          if (raw && (!Number.isSafeInteger(Number(raw)) || Number(raw) < 0))
            throw new Error("Số pallet và số thiết bị phải là số nguyên không âm.");
          data[stage][field] = raw === "" ? null : Number(raw);
        } else { data[stage][field] = raw || null; }
      }
    }
    return data;
  }
  function init() {
    const form = $("scenario-capacity-form");
    if (!form) return;
    $("scenario-stage").addEventListener("change", fill);
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const status = $("scenario-capacity-status");
      const button = $("scenario-save-all");
      try {
        const stage = $("scenario-stage").value;
        const workers = Number($("scenario-workers").value);
        const perHour = Number($("scenario-per-hour").value);
        if (!Object.hasOwn(names, stage) || !Number.isInteger(workers) || workers < 1 || workers > 20 ||
            !Number.isInteger(perHour) || perHour < 1 || perHour > 500)
          throw new Error("Cần 1–20 nhân viên và 1–500 thùng/người/giờ.");
        const ai = collectAI();
        button.disabled = true;
        status.textContent = "Đang lưu kịch bản...";
        await WmsDemo.setCapacity(stage, workers, perHour);
        window.RFConfig.save(ai);
        localStorage.setItem("smartwms:scenario-saved-at", new Date().toISOString());
        status.textContent = "Đã lưu kịch bản chung. Năng lực " + names[stage] + " và cấu hình AI của 5 công đoạn đã được cập nhật.";
        if (typeof simUpdate === "function") simUpdate();
      } catch (error) { status.textContent = "Không thể lưu: " + error.message; }
      finally { button.disabled = false; }
    });
    fill();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
