(async function () {
  "use strict";
  const panel = document.getElementById("rf-evaluation-panel");
  if (!panel) return;
  try {
    const response = await fetch("rf_verified_evaluation.json?v=1", {cache:"no-store"});
    if (!response.ok) throw new Error("Không tìm thấy rf_verified_evaluation.json");
    const data = await response.json();
    if (!data.metrics || !Array.isArray(data.test_predictions) || data.test_predictions.length !== 30)
      throw new Error("Dữ liệu đánh giá không hợp lệ");
    const all = data.test_predictions;
    const mae = all.reduce((s,r)=>s+Math.abs(r.actual_minutes-r.predicted_minutes),0)/all.length;
    const rmse = Math.sqrt(all.reduce((s,r)=>s+(r.actual_minutes-r.predicted_minutes)**2,0)/all.length);
    const mean = all.reduce((s,r)=>s+r.actual_minutes,0)/all.length;
    const ssTot=all.reduce((s,r)=>s+(r.actual_minutes-mean)**2,0);
    const r2=1-all.reduce((s,r)=>s+(r.actual_minutes-r.predicted_minutes)**2,0)/ssTot;
    if (Math.abs(mae-data.metrics.MAE_min)>.0001 || Math.abs(rmse-data.metrics.RMSE_min)>.0001 || Math.abs(r2-data.metrics.R2)>.0001)
      throw new Error("Chỉ số không khớp 30 bản ghi kiểm thử");
    panel.replaceChildren();
    const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
    panel.appendChild(el("h2","Đánh giá Random Forest — Kết quả tính lại từ 30 bản ghi kiểm thử"));
    panel.appendChild(el("p","Nguồn: SQL đã cung cấp + mô hình random_forest_cycle_time.pkl; kiểm thử 6 bản ghi cuối theo thời gian ở mỗi công đoạn. Kết quả offline, không phải dữ liệu kho thực tế."));
    const summary=el("div");summary.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:16px 0";
    [["MAE",mae.toFixed(3)+" phút"],["RMSE",rmse.toFixed(3)+" phút"],["R²",r2.toFixed(4)]].forEach(([name,value])=>{
      const c=el("div");c.style.cssText="border:1px solid #dbe4ef;border-radius:10px;padding:14px";
      c.append(el("div",name),el("h2",value));summary.append(c);
    });panel.append(summary);
    const warning=el("p","Giới hạn: Chỉ 30 bản ghi kiểm thử từ dữ liệu tổng hợp. Chưa chứng minh tính đại diện cho kho thực tế hoặc không rò rỉ dữ liệu huấn luyện.");warning.className="card-note";panel.append(warning);
    panel.append(el("h3","Feature Importance — Trích trực tiếp từ mô hình .pkl"));
    const fi=el("div");
    data.feature_importance.slice().sort((a,b)=>b.importance-a.importance).forEach(item=>{
      const line=el("div",item.feature+" — "+(item.importance*100).toFixed(2)+"%");line.style.margin="6px 0";
      const track=el("div");track.style.cssText="height:8px;background:#e8eef6;border-radius:5px";
      const bar=el("div");bar.style.cssText="height:100%;background:#2563eb;border-radius:5px;width:"+(item.importance*100)+"%";
      track.append(bar);fi.append(line,track);
    });panel.append(fi);
    panel.append(el("h3","Actual vs Predicted — 30 dự đoán kiểm thử"));
    const label=el("label","Chọn công đoạn: ");label.htmlFor="verified-rf-stage";
    const select=el("select");select.id="verified-rf-stage";select.style.cssText="padding:8px;margin:12px";
    const names={RECEIVING:"Nhận hàng",PUTAWAY:"Cất hàng",PICKING:"Lấy hàng",PACKING:"Đóng gói",SHIPPING:"Xuất hàng"};
    Object.entries(names).forEach(([code,name])=>{const o=el("option",name);o.value=code;select.append(o)});
    panel.append(label,select);
    const chart=el("div");panel.append(chart);
    const render=()=>{
      chart.replaceChildren();const rows=all.filter(r=>r.stage===select.value);
      const stageMae=rows.reduce((s,r)=>s+Math.abs(r.actual_minutes-r.predicted_minutes),0)/rows.length;
      chart.append(el("p","Số bản ghi: "+rows.length+" | MAE công đoạn: "+stageMae.toFixed(2)+" phút"));
      rows.forEach(r=>{
        const box=el("div");box.style.cssText="padding:10px;margin:8px 0;border:1px solid #dbe4ef;border-radius:8px";
        box.append(el("strong","Mã bản ghi "+r.workload_id),el("p","Thực tế: "+r.actual_minutes.toFixed(2)+" phút | Dự đoán: "+r.predicted_minutes.toFixed(2)+" phút"));chart.append(box);
      });
    };select.addEventListener("change",render);render();
  } catch(err) {
    panel.replaceChildren();panel.appendChild(document.createTextNode("Không thể xác minh kết quả đánh giá: "+err.message));
  }
})();
