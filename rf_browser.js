// Browser inference for trained RandomForestRegressor; no retraining in browser.
window.WmsRF = {
  async load(url = "rf_browser_model.json") {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Cannot load Random Forest model");
    this.model = await response.json();
    return this;
  },
  predict(input) {
    const m = this.model;
    if (!m) throw new Error("Call WmsRF.load() before predict()");
    const x = [];
    m.categorical.forEach((key,i) => {
      m.categories[i].forEach(value => x.push(String(input[key] ?? "") === value ? 1 : 0));
    });
    m.numeric.forEach(key => {
      const v = Number(input[key]);
      if (!Number.isFinite(v)) throw new Error("Invalid or missing feature: " + key);
      x.push(v);
    });
    let sum = 0;
    for (const tree of m.trees) {
      let node = 0;
      while (tree.l[node] !== -1) {
        node = x[tree.f[node]] <= tree.t[node] ? tree.l[node] : tree.r[node];
      }
      sum += tree.v[node];
    }
    return sum / m.trees.length;
  }
};
