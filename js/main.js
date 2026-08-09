/* ============================================================
   [A] Storyのトラックと詳細モーダル   ← モーダルの開閉処理はここ
   [B] スクロールでのフェードアップ
   ============================================================ */


/* ---------- [A] トラックとモーダル ---------- */

(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tl-btn'));
  if (!tabs.length) return;

  var tl     = document.querySelector('.tl');
  var modal  = document.getElementById('story-modal');
  var box    = modal.querySelector('.modal-box');
  var panels = Array.prototype.slice.call(modal.querySelectorAll('.ep'));
  var calm   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0;
  var lastFocused = null;

  /* 選ばれたSTEPを示し、人物をその地点まで走らせる */
  function mark(index) {
    tabs.forEach(function (tab, i) {
      var on = (i === index);
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    current = index;
    tl.dataset.step = tabs[index].dataset.step;
  }

  /* --- モーダルを開く --- */
  function open(index) {
    mark(index);

    var step = tabs[index].dataset.step;
    panels.forEach(function (panel) {
      panel.hidden = (panel.dataset.step !== step);
    });

    lastFocused = document.activeElement;
    document.body.style.overflow = 'hidden';   /* 背景をスクロールさせない */

    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('is-open'); });

    box.scrollTop = 0;
    modal.querySelector('.modal-close').focus();
  }

  /* --- モーダルを閉じる --- */
  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () {
      modal.hidden = true;
      if (lastFocused) lastFocused.focus();
    }, calm ? 0 : 300);
  }

  /* 開く：トラックのSTEPを押したとき */
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { open(i); });
  });

  /* 閉じる：×ボタン、背景の暗い部分 */
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });

  /* 閉じる：ESCキー */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  /* 左右キーでSTEPを移動（モーダルは開かない） */
  tl.addEventListener('keydown', function (e) {
    var last = tabs.length - 1;
    var next = null;
    if (e.key === 'ArrowRight') next = current === last ? 0 : current + 1;
    if (e.key === 'ArrowLeft')  next = current === 0 ? last : current - 1;
    if (next === null) return;
    e.preventDefault();
    mark(next);
    tabs[next].focus();
  });

  mark(0);
})();


/* ---------- [B] スクロールでのフェードアップ ---------- */

(function () {
  var targets = document.querySelectorAll('.fade');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (calm || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

  targets.forEach(function (el) { io.observe(el); });

  /* 保険：すでに画面に入っている要素は、その場で表示する */
  function showVisible() {
    targets.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }

  showVisible();
  window.addEventListener('load', showVisible);
})();
