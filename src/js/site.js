(() => {
    "use strict";

    function readTheme() {
        try {
            return localStorage.getItem("theme") === "dark" ? "dark" : "light";
        } catch (error) {
            if (error instanceof DOMException && error.name === "SecurityError") return "light";
            throw error;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem("theme", theme);
        } catch (error) {
            if (error instanceof DOMException && ["SecurityError", "QuotaExceededError"].includes(error.name)) return;
            throw error;
        }
    }

    function initializeTheme() {
        const button = document.querySelector(".theme-toggle");
        const label = button.querySelector("[data-theme-label]");
        function show(theme) {
            document.documentElement.dataset.theme = theme;
            button.setAttribute("aria-pressed", String(theme === "dark"));
            button.setAttribute("aria-label", theme === "dark" ? "Use light theme" : "Use dark theme");
            label.textContent = theme === "dark" ? "light" : "dark";
        }
        show(readTheme());
        button.hidden = false;
        button.addEventListener("click", () => {
            const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            show(theme);
            saveTheme(theme);
        });
    }

    function selectCode(code, button) {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "Code selected";
        button.setAttribute("aria-label", "Code selected. Use your keyboard to copy.");
    }

    function initializeCode() {
        document.querySelectorAll(".post-content pre").forEach((pre, index) => {
            const code = pre.querySelector("code");
            if (!code) return;
            const frame = document.createElement("figure");
            frame.className = "code-window";
            const toolbar = document.createElement("figcaption");
            toolbar.className = "code-toolbar";
            const label = document.createElement("span");
            const language = Array.from(pre.classList).find(name => name.startsWith("language-"));
            label.textContent = language ? language.slice(9) : "Code";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "copy-code";
            button.textContent = "Copy";
            button.setAttribute("aria-label", `Copy code example ${index + 1}`);
            const status = document.createElement("span");
            status.className = "sr-only";
            status.setAttribute("aria-live", "polite");
            toolbar.append(label, button, status);
            pre.replaceWith(frame);
            frame.append(toolbar, pre);
            let reset;
            button.addEventListener("click", async () => {
                clearTimeout(reset);
                button.disabled = true;
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(code.textContent);
                        button.textContent = "Copied";
                        status.textContent = "Code copied to clipboard.";
                    } else {
                        selectCode(code, button);
                        status.textContent = "Code selected. Use your keyboard to copy.";
                    }
                } catch (error) {
                    if (!(error instanceof DOMException) || !["NotAllowedError", "SecurityError"].includes(error.name)) throw error;
                    selectCode(code, button);
                    status.textContent = "Clipboard access is unavailable. Code selected for manual copy.";
                } finally {
                    button.disabled = false;
                }
                reset = setTimeout(() => {
                    button.textContent = "Copy";
                    button.setAttribute("aria-label", `Copy code example ${index + 1}`);
                    status.textContent = "";
                }, 2200);
            });
        });
    }

    function initializeReading() {
        const article = document.querySelector("[data-reading]");
        const rail = document.querySelector(".reading-rail");
        if (!article || !rail) return;
        const details = rail.querySelector("details");
        const desktop = window.matchMedia("(min-width: 960px)");
        details.open = desktop.matches;
        desktop.addEventListener("change", event => { details.open = event.matches; });
        const links = Array.from(details.querySelectorAll('a[href^="#"]'));
        const entries = links.map(link => ({link, heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))})).filter(entry => entry.heading);
        const position = rail.querySelector(".reading-position");
        const progress = position.querySelector("progress");
        const percent = position.querySelector("output");
        position.hidden = false;
        let scheduled = false;
        function update() {
            const rect = article.getBoundingClientRect();
            const distance = Math.max(1, rect.height - window.innerHeight);
            const value = Math.round(Math.min(1, Math.max(0, -rect.top / distance)) * 100);
            progress.value = value;
            progress.textContent = `${value}%`;
            percent.textContent = `${value}%`;
            let current = entries[0];
            for (const entry of entries) {
                if (entry.heading.getBoundingClientRect().top <= 120) current = entry;
            }
            for (const entry of entries) {
                if (entry === current) entry.link.setAttribute("aria-current", "location");
                else entry.link.removeAttribute("aria-current");
            }
            scheduled = false;
        }
        function schedule() {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(update);
        }
        window.addEventListener("scroll", schedule, {passive: true});
        window.addEventListener("resize", schedule);
        window.addEventListener("load", schedule, {once: true});
        update();
    }

    function initializePhotos() {
        const button = document.querySelector(".shuffle-photo");
        if (!button) return;
        const entries = Array.from(document.querySelectorAll("[data-photo-src]"));
        if (entries.length < 2) return;
        const image = document.querySelector("[data-photo-image]");
        const link = document.querySelector("[data-photo-link]");
        const caption = document.querySelector("[data-photo-caption]");
        const status = document.querySelector("[data-photo-status]");
        let current = 0;
        button.hidden = false;
        button.addEventListener("click", () => {
            const next = (current + 1 + Math.floor(Math.random() * (entries.length - 1))) % entries.length;
            const entry = entries[next].dataset;
            const pending = new Image();
            button.disabled = true;
            pending.addEventListener("load", () => {
                image.src = entry.photoSrc;
                image.alt = `Photograph from ${entry.photoDate}`;
                link.href = entry.photoUrl;
                caption.textContent = `${entry.photoCamera} / ${entry.photoDate}`;
                current = next;
                status.textContent = `Photograph from ${entry.photoDate}.`;
                button.disabled = false;
            }, {once: true});
            pending.addEventListener("error", () => {
                status.textContent = "This photograph did not load. Try another frame.";
                button.disabled = false;
            }, {once: true});
            pending.src = entry.photoSrc;
        });
    }

    initializeTheme();
    initializeCode();
    initializeReading();
    initializePhotos();
})();
