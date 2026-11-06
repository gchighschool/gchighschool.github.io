/* ==========================================================================
   Ghonar Chala High School — people.js
   Renders the teacher roster (teachers.html) and the managing committee
   roster (committee.html) from data/teachers.json and data/committee.json.

   Follows the same shape as news.js: fetch the JSON once per page load,
   render, and redraw on the `languagechange` event that M.setLang fires so
   switching language swaps names/roles instantly with no page reload.
   Loaded with `defer`, after site.js.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var M = window.M;
  if (!M) return;

  var AVATAR_SIZE = 76;

  /** Fetch a people JSON file once. Not cached across pages — each page only
   *  ever needs one of the two files. */
  function loadPeople(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /** "Md. Nazrul Islam" -> "MN" — first letter of the first and last word. */
  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  /**
   * A circular avatar: the person's photograph when one is set, otherwise an
   * initials badge. Both use the shared .m-avatar rule in style.css.
   */
  function avatar(person) {
    var wrap = M.el('div', { class: 'd-flex justify-content-center mb-3' });
    var photo = person.photo;
    if (photo) {
      wrap.appendChild(M.el('div', { class: 'm-avatar' }, [
        M.el('img', { src: photo, alt: '', width: AVATAR_SIZE, height: AVATAR_SIZE })
      ]));
    } else {
      wrap.appendChild(M.el('div', {
        class: 'm-avatar',
        'aria-hidden': 'true',
        text: initials(M.pick(person.name))
      }));
    }
    return wrap;
  }

  /** One roster card: avatar, role, name, and an optional subject / note. */
  function personCard(person) {
    var card = M.el('div', { class: 'm-card h-100 text-center' }, [avatar(person)]);

    var designation = M.pick(person.designation);
    if (designation) card.appendChild(M.el('span', { class: 'm-eyebrow', text: designation }));

    card.appendChild(M.el('h3', { text: M.pick(person.name) }));

    var subject = M.pick(person.subject);
    if (subject) card.appendChild(M.el('p', { class: 'm-muted small mb-1', text: subject }));

    var note = M.pick(person.note);
    if (note) card.appendChild(M.el('p', { class: 'm-muted mb-0', text: note }));

    if (person.joined) {
      card.appendChild(M.el('p', { class: 'm-muted small mb-0 mt-2' }, [
        M.t('teach.joined') + ': ',
        M.el('time', { datetime: person.joined, text: M.formatDate(person.joined) })
      ]));
    }

    return M.el('div', { class: 'col-12 col-sm-6 col-lg-4' }, [card]);
  }

  function message(target, key) {
    target.className = 'm-empty';
    M.clear(target);
    target.appendChild(M.el('p', { class: 'm-muted mb-0', text: M.t(key) }));
  }

  /**
   * Wire up one roster grid.
   * `selector` finds the container, `url` is the JSON file, `dataKey` is the
   * array's key in that file ('teachers' or 'members'), and `emptyKey` /
   * `errorKey` name the i18n strings shown when the list is empty or the
   * fetch fails.
   */
  function initGroup(selector, url, dataKey, emptyKey, errorKey) {
    var target = M.qs(selector);
    if (!target) return;

    loadPeople(url).then(function (data) {
      var list = (data && data[dataKey]) || [];

      var render = function () {
        if (!list.length) { message(target, emptyKey); return; }
        target.className = 'row g-4';
        M.clear(target);
        list.forEach(function (person) { target.appendChild(personCard(person)); });
      };

      render();
      document.addEventListener('languagechange', render);
    }).catch(function () {
      message(target, errorKey);
    });
  }

  function init() {
    initGroup('[data-teachers-list]', 'data/teachers.json', 'teachers', 'teach.empty', 'teach.error');
    initGroup('[data-committee-list]', 'data/committee.json', 'members', 'comm.empty', 'comm.error');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window, document));
