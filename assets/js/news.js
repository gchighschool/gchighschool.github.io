/* ==========================================================================
   Ghonar Chala High School — news.js
   Renders the notice board: the three-item preview on the home page, the full
   list on notices.html, and a single notice on notices/<id>.html.

   Every renderer redraws on the `languagechange` event that M.setLang fires,
   so switching language swaps notice content instantly with no page reload.
   Loaded with `defer`, after site.js.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var M = window.M;
  if (!M) return;

  var HOME_PREVIEW_COUNT = 3;
  var OTHERS_COUNT = 4;

  function message(target, key) {
    M.clear(target);
    target.appendChild(M.el('p', { class: 'm-muted mb-0', text: M.t(key) }));
  }

  /** Query-string reader — avoids URLSearchParams for older mobile browsers. */
  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  /* ------------------------------------------------- home page: 3 newest */

  function initHomePreview() {
    var target = M.qs('[data-home-notices]');
    if (!target) return;

    M.loadNotices().then(function (notices) {
      var render = function () {
        M.clear(target);
        if (!notices.length) {
          message(target, 'news.empty');
          return;
        }
        notices.slice(0, HOME_PREVIEW_COUNT).forEach(function (n) {
          target.appendChild(M.noticeRow(n));
        });
      };
      render();
      document.addEventListener('languagechange', render);
    }).catch(function () {
      message(target, 'news.error');
    });
  }

  /* --------------------------------------------------- notices.html: full list */

  function initList() {
    var target = M.qs('[data-news-list]');
    if (!target) return;
    var countEl = M.qs('[data-news-count]');

    M.loadNotices().then(function (notices) {
      var render = function () {
        M.clear(target);

        if (countEl) {
          countEl.textContent = notices.length === 1
            ? M.t('news.count1')
            : M.t('news.count').replace('%N%', M.num(notices.length));
        }

        if (!notices.length) {
          target.className = 'm-empty';
          message(target, 'news.empty');
          return;
        }

        target.className = 'm-card';
        notices.forEach(function (n) { target.appendChild(M.noticeRow(n)); });
      };
      render();
      document.addEventListener('languagechange', render);
    }).catch(function () {
      if (countEl) countEl.textContent = '';
      message(target, 'news.error');
    });
  }

  /* ------------------------------------------- notices/<id>.html: one notice */

  function initDetail() {
    var bodyEl = M.qs('[data-detail-body]');
    if (!bodyEl) return;

    var titleEl = M.qs('[data-detail-title]');
    var dateEl = M.qs('[data-detail-date]');
    var catEl = M.qs('[data-detail-category]');
    var othersEl = M.qs('[data-detail-others]');
    // Static pages built by tools/build.py carry the id in data-notice-id; the
    // ?id= form is kept so a hand-made link still works.
    var id = bodyEl.getAttribute('data-notice-id') || param('id');

    // The heading ships a "loading" string via data-i18n; once a notice is in
    // hand the attribute has to go, or the next language swap would overwrite
    // the title with that placeholder again.
    function releaseTitle() {
      if (titleEl) titleEl.removeAttribute('data-i18n');
      document.documentElement.removeAttribute('data-title-key');
    }

    function renderMissing() {
      releaseTitle();
      if (titleEl) titleEl.textContent = M.t('news.notFound');
      if (dateEl) dateEl.textContent = M.t('news.notFoundText');
      if (catEl) catEl.textContent = '';
      M.clear(bodyEl);
      document.title = M.t('news.notFound');
    }

    M.loadNotices().then(function (notices) {
      var notice = null;
      for (var i = 0; i < notices.length; i++) {
        if (String(notices[i].id) === String(id)) { notice = notices[i]; break; }
      }

      var render = function () {
        if (!notice) { renderMissing(); return; }
        releaseTitle();

        var title = M.pick(notice.title);
        if (titleEl) titleEl.textContent = title;
        document.title = title + ' — ' + M.t('brand.name');

        if (catEl) catEl.textContent = M.pick(notice.category);

        if (dateEl) {
          M.clear(dateEl);
          dateEl.appendChild(document.createTextNode(M.t('news.published') + ': '));
          dateEl.appendChild(M.el('time', {
            datetime: notice.date,
            text: M.formatDate(notice.date)
          }));
        }

        M.renderBody(bodyEl, notice.body);

        if (othersEl) {
          M.clear(othersEl);
          var others = notices.filter(function (n) { return n !== notice; }).slice(0, OTHERS_COUNT);
          if (!others.length) {
            othersEl.appendChild(M.el('p', { class: 'm-muted mb-0', text: M.t('news.empty') }));
          } else {
            others.forEach(function (n) {
              othersEl.appendChild(M.noticeRow(n, { compact: true }));
            });
          }
        }
      };

      render();
      document.addEventListener('languagechange', render);
    }).catch(function () {
      releaseTitle();
      if (titleEl) titleEl.textContent = M.t('news.error');
      if (dateEl) dateEl.textContent = '';
      M.clear(bodyEl);
    });
  }

  function init() {
    initHomePreview();
    initList();
    initDetail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window, document));
