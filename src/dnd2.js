  // drag & drop reorder for scenario lists: ul._arr = items array, ul._done = callback
  function sceDnd(root) {
    root.querySelectorAll("ul.sce-l").forEach((ul) => {
      if (!ul._arr) return;
      ul.querySelectorAll(":scope > li").forEach((li, i) => { li.dataset.i = i; const n = li.querySelector(".sce-n"); if (n) n.title = "Потяни, чтобы переставить"; });
      ul.onpointerdown = (e) => {
        const li = e.target.closest("li"); if (!li || e.button !== 0 || e.target.closest("input, button")) return;
        e.preventDefault(); const from = +li.dataset.i, r0 = li.getBoundingClientRect(), dy0 = e.clientY - r0.top;
        let moved = false;
        const mv = (ev) => {
          if (!moved && Math.abs(ev.clientY - e.clientY) < 4) return;
          if (!moved) { moved = true; li.classList.add("sce-drag"); document.body.style.userSelect = "none"; }
          li.style.transform = `translateY(${ev.clientY - dy0 - li.getBoundingClientRect().top + (parseFloat(li.style.transform.slice(11)) || 0)}px)`;
          const sib = [...ul.children].filter((x) => x !== li && x.tagName === "LI");
          const before = sib.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
          const t0 = li.getBoundingClientRect().top;
          if (before) { if (li.nextElementSibling !== before) ul.insertBefore(li, before); } else if (sib.length && ul.lastElementChild !== li) ul.appendChild(li);
          const t1 = li.getBoundingClientRect().top; if (t1 !== t0) li.style.transform = `translateY(${(parseFloat(li.style.transform.slice(11)) || 0) - (t1 - t0)}px)`;
        };
        const up = () => {
          document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.body.style.userSelect = "";
          if (!moved) return; li.classList.remove("sce-drag"); li.style.transform = "";
          const to = [...ul.querySelectorAll(":scope > li")].indexOf(li);
          if (to !== from && to >= 0) { const [it] = ul._arr.splice(from, 1); ul._arr.splice(to, 0, it); }
          ul._done();
        };
        document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
      };
    });
  }
