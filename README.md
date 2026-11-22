# LifeOS

https://dmitry-aleshkevich.github.io/lifeOs/

## Сборка
- `src/shell.html` — разметка, `src/app.css` — стили, `src/js/*.js` — код (склеивается по порядку имён).
- `python3 build.py` → `index.html` для артефакта (один файл).
- `python3 build_gh.py index.html` → версия для GitHub Pages (вход через Supabase, `shim.html`).
- Тесты: `tests/run_tests.sh` (Playwright).

## Модули JS
00-core (даты, данные, сохранение) · 10-task-row (строка задачи) · 20-views (шапка, календарь, день) · 30-work (Работа) · 40-today (Сегодня, быстрый ввод, раскрытие задачи) · 50-extras (сценарии, шаблон дня, Баг, вечерний баннер) · 60-plan (План-канбан) · 70-habits-stats · 80-timer-system (таймер, звук, перетаскивание)
