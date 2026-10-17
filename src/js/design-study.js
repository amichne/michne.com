"use strict";

(() => {
  const root = document.documentElement;
  const treatments = {
    ad: "A narrow serif leads the headline. Garamond carries the prose.",
    book: "Garamond shapes the headline and prose."
  };
  const params = new URLSearchParams(window.location.search);
  const requestedType = params.get("type");
  let type = Object.hasOwn(treatments, requestedType)
    ? requestedType
    : params.get("direction") === "guide" ? "book" : "ad";
  let mode = params.get("mode") === "dark" ? "dark" : "light";

  function render() {
    root.dataset.type = type;
    root.dataset.mode = mode;
    document.querySelector("[data-type-description]").textContent = treatments[type];
    document.querySelectorAll("[data-type-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.typeChoice === type));
    });
    const toggle = document.querySelector("[data-mode-toggle]");
    toggle.setAttribute("aria-pressed", String(mode === "dark"));
    toggle.textContent = mode === "dark" ? "Use light paper" : "Use dark paper";
    const url = new URL(window.location.href);
    url.searchParams.delete("direction");
    url.searchParams.delete("ink");
    url.searchParams.set("type", type);
    url.searchParams.set("mode", mode);
    window.history.replaceState(null, "", url);
  }

  document.querySelectorAll("[data-type-choice]").forEach(button => {
    button.addEventListener("click", () => {
      type = button.dataset.typeChoice;
      render();
      document.querySelector(".study-status").textContent = treatments[type];
    });
  });
  document.querySelector("[data-mode-toggle]").addEventListener("click", () => {
    mode = mode === "light" ? "dark" : "light";
    render();
  });
  render();
})();
