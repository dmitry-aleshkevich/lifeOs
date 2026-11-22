  // touch: long-press = context menu (task menus need it on phones)
  (() => {
    let lt = null, sx = 0, sy = 0;
    document.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return; const t = e.touches[0], el = e.target.closest("li.task, .dblk, .wcard, .wtask, .mins"); if (!el) return;
      sx = t.clientX; sy = t.clientY; clearTimeout(lt);
      lt = setTimeout(() => { lt = null; try { navigator.vibrate && navigator.vibrate(10); } catch {} el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: sx, clientY: sy })); suppressLP = true; setTimeout(() => { suppressLP = false; }, 500); }, 520);
    }, { passive: true });
    const cancel = (e) => { if (!lt) return; if (e.type === "touchmove") { const t = e.touches[0]; if (Math.abs(t.clientX - sx) < 10 && Math.abs(t.clientY - sy) < 10) return; } clearTimeout(lt); lt = null; };
    ["touchmove", "touchend", "touchcancel"].forEach((n) => document.addEventListener(n, cancel, { passive: true }));
    let suppressLP = false; document.addEventListener("click", (e) => { if (suppressLP) { e.stopPropagation(); e.preventDefault(); suppressLP = false; } }, true);
  })();
