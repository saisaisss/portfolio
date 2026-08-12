/* ============================================================
   斎藤奨大｜自己紹介サイト  ／  JS = 動き（アニメーション）だけ

   役割分担
     HTML … 構造だけ
     CSS  … 色・サイズ・配置
     JS   … 動きだけ（このファイル）

   動きは3種類
     [1] スクロールで浮かび上がる
     [2] トラックの人物が走って移動する
     [3] モーダルが開く／閉じる

   すべて element.animate() で書いている。
   CSSには transition も @keyframes も一切書いていない。
   ============================================================ */


/* ============================================================
   [1] スクロールで浮かび上がる
       対象：class="fade" が付いた要素
   ============================================================ */

(function () {

  var targets = document.querySelectorAll('.fade');
  if (!targets.length) return;

  /* 動きを控える設定の人には、動かさずに表示だけする */
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fadeUp(el, delay) {
    if (el.dataset.shown) return;
    el.dataset.shown = '1';

    if (calm) { el.style.opacity = 1; return; }

    el.animate(
      [
        { opacity: 0, transform: 'translateY(30px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 800, delay: delay || 0, easing: 'ease-out', fill: 'forwards' }
    );
  }

  /* 画面に入ったかどうかを見張る */
  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      /* 強みの3つだけ、少しずつ遅らせて出す */
      var group = entry.target.parentElement;
      var delay = 0;
      if (group && group.classList.contains('st-grid')) {
        delay = Array.prototype.indexOf.call(group.children, entry.target) * 120;
      }

      fadeUp(entry.target, delay);
      watcher.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

  targets.forEach(function (el) { watcher.observe(el); });

  /* 読み込んだ時点で画面に入っている要素は、その場で出す */
  targets.forEach(function (el) {
    var box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) fadeUp(el, 0);
  });

})();


/* ============================================================
   [2][3] トラックの人物 ＋ モーダル
       このページにトラックが無ければ、何もしない
   ============================================================ */

(function () {

  var buttons = Array.prototype.slice.call(document.querySelectorAll('.tl-btn'));
  if (!buttons.length) return;

  var track  = document.querySelector('.tl');
  var runner = document.querySelector('.oval-runner');
  var body   = document.querySelector('.oval-runner-body');
  var modal  = document.getElementById('story-modal');
  var box    = modal.querySelector('.modal-box');
  var cover  = modal.querySelector('.modal-overlay');
  var panels = Array.prototype.slice.call(modal.querySelectorAll('.ep'));

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 各STEPが、レーン1周のどこに当たるか（％）

     レーン1周の長さ ＝ 直線204 × 2 ＋ 半円(π×100=314.2) × 2 ＝ 1036.4
       STEP01 スタート地点         0      →   0%
       STEP02 直線を走り終えた     204    →  19.7%
       STEP03 左カーブの頂点       361.1  →  34.8%
       STEP04 カーブを抜けた       518.2  →  50%
       STEP05 下の直線の終わり     722.2  →  69.7%
       STEP06 トラックの出口       879.2  →  84.8%                        */
  var POINT = { '01': 0, '02': 19.7, '03': 34.8, '04': 50, '05': 69.7, '06': 84.8 };

  var nowAt = 0;          /* 人物がいまいる位置 */
  var moving = null;      /* 実行中の移動アニメーション */
  var lastFocus = null;


  /* ---------- [2] 人物を、押されたSTEPまで走らせる ---------- */

  function runTo(step) {
    var to = POINT[step];

    if (calm) {
      runner.style.offsetDistance = to + '%';
      nowAt = to;
      return;
    }

    if (moving) moving.cancel();

    moving = runner.animate(
      [ { offsetDistance: nowAt + '%' }, { offsetDistance: to + '%' } ],
      { duration: 1200, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' }
    );

    nowAt = to;
  }

  /* 走っているあいだ、上下に小さく跳ねる（ずっと繰り返す） */
  if (!calm) {
    body.animate(
      [ { transform: 'translateY(0)' }, { transform: 'translateY(-3px)' } ],
      { duration: 420, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
    );
  }


  /* ---------- 選択中のSTEPに印を付ける（見た目はCSS） ---------- */

  function select(index) {
    buttons.forEach(function (btn, i) {
      var on = (i === index);
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    track.dataset.step = buttons[index].dataset.step;
    runTo(buttons[index].dataset.step);
  }


  /* ---------- [3] モーダルを開く ---------- */

  function openModal(index) {
    select(index);

    var step = buttons[index].dataset.step;
    panels.forEach(function (panel) {
      panel.hidden = (panel.dataset.step !== step);
    });

    lastFocus = document.activeElement;
    document.body.style.overflow = 'hidden';   /* 背景をスクロールさせない */
    modal.hidden = false;
    box.scrollTop = 0;

    if (!calm) {
      cover.animate([{ opacity: 0 }, { opacity: 1 }],
                    { duration: 300, fill: 'forwards' });
      box.animate(
        [ { opacity: 0, transform: 'scale(0.97)' },
          { opacity: 1, transform: 'scale(1)' } ],
        { duration: 300, easing: 'ease-out', fill: 'forwards' }
      );
    }

    modal.querySelector('.modal-close').focus();
  }


  /* ---------- モーダルを閉じる ---------- */

  function closeModal() {
    document.body.style.overflow = '';

    function finish() {
      modal.hidden = true;
      if (lastFocus) lastFocus.focus();
    }

    if (calm) { finish(); return; }

    cover.animate([{ opacity: 1 }, { opacity: 0 }],
                  { duration: 250, fill: 'forwards' });

    var out = box.animate(
      [ { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.97)' } ],
      { duration: 250, easing: 'ease-in', fill: 'forwards' }
    );

    out.onfinish = finish;
  }


  /* ---------- 操作の受け付け ---------- */

  /* STEPを押したら開く */
  buttons.forEach(function (btn, i) {
    btn.addEventListener('click', function () { openModal(i); });
  });

  /* ×ボタン、または背景の暗い部分で閉じる */
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) closeModal();
  });

  /* ESCキーで閉じる */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* 最初はSTEP 01を選んでおく */
  select(0);

})();

/* =========================
   いいねボタンの計測
========================= */

const likeButton = document.getElementById('like-button');

if (likeButton) {
  likeButton.addEventListener('click', function () {

    // GTMのdataLayerへクリック情報を送る
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: 'like_click',
      reaction_type: 'like',
      button_id: this.id,
      button_class: this.className,
      button_text: this.textContent.trim()
    });

    // ユーザーにクリック済みだと分かるようにする
    this.textContent = '👍 ありがとう！';
    this.disabled = true;
  });
}