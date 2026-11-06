/* notices.html — searchable, filterable, paginated notice archive. */
(function () {
  'use strict';
  var GC = window.GC, PAGE_SIZE = 10;

  var mount   = GC.qs('#noticeList');
  var searchI = GC.qs('#noticeSearch');
  var chipBox = GC.qs('#noticeFilters');
  var pager   = GC.qs('#noticePager');
  var countEl = GC.qs('#noticeCount');
  if (!mount) return;

  var all = [], query = '', category = '', page = 1;

  /* Pinned first, then newest. The old code relied on the array's own order. */
  function sortNotices(list) {
    return list.slice().sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return String(b.id).localeCompare(String(a.id));
    });
  }

  function matches(n) {
    if (category && n.category !== category) return false;
    if (!query) return true;
    var hay = GC.norm([n.title, n.titleEn, n.body, n.category].join(' '));
    return hay.indexOf(GC.norm(query)) !== -1;
  }

  function noticeRow(n) {
    var titleLink = GC.el('a', { href: 'notice-view.html?id=' + encodeURIComponent(n.id), text: n.title });

    var heading = GC.el('h3', {}, [titleLink]);
    if (n.pinned) {
      heading.insertBefore(
        GC.el('i', { class: 'bi bi-pin-angle-fill gc-badge-pin', title: 'পিন করা', 'aria-label': 'পিন করা' }), titleLink);
    }
    if (GC.isNew(n.date)) heading.appendChild(GC.el('span', { class: 'gc-badge-new', text: 'নতুন' }));

    var meta = GC.el('div', { class: 'gc-notice-meta' }, [
      GC.el('span', {}, [GC.el('i', { class: 'bi bi-calendar3 me-1', 'aria-hidden': 'true' }), GC.timeEl(n.date)])
    ]);
    if (n.category) meta.appendChild(GC.el('span', { class: 'gc-chip', text: n.category }));
    if (n.attachment && n.attachment.url) {
      meta.appendChild(GC.el('a', { href: n.attachment.url, class: 'text-decoration-none' }, [
        GC.el('i', { class: 'bi bi-paperclip me-1', 'aria-hidden': 'true' }),
        n.attachment.label || 'সংযুক্তি'
      ]));
    }
    return GC.el('article', { class: 'gc-notice-row' }, [heading, meta]);
  }

  function renderPager(totalPages) {
    GC.clear(pager);
    if (totalPages <= 1) return;
    var ul = GC.el('ul', { class: 'pagination justify-content-center mb-0' });

    function item(label, target, disabled, active) {
      var li = GC.el('li', { class: 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '') });
      var a = GC.el('a', { class: 'page-link', href: '#', text: label });
      if (active) a.setAttribute('aria-current', 'page');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (disabled || active) return;
        page = target;
        draw();
        mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(a);
      return li;
    }

    ul.appendChild(item('‹', page - 1, page === 1, false));
    for (var i = 1; i <= totalPages; i++) ul.appendChild(item(GC.bnNum(i), i, false, i === page));
    ul.appendChild(item('›', page + 1, page === totalPages, false));
    pager.appendChild(ul);
  }

  function syncUrl() {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams();
    if (query) p.set('q', query);
    if (category) p.set('category', category);
    if (page > 1) p.set('page', page);
    var qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
  }

  function draw() {
    var filtered = all.filter(matches);
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;

    GC.clear(mount);
    if (!filtered.length) {
      mount.appendChild(GC.stateEmpty(
        query || category ? 'এই অনুসন্ধানে কোনো নোটিশ পাওয়া যায়নি।' : 'এখনো কোনো নোটিশ প্রকাশ করা হয়নি।'));
    } else {
      filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).forEach(function (n) {
        mount.appendChild(noticeRow(n));
      });
    }

    if (countEl) {
      countEl.textContent = filtered.length
        ? 'মোট ' + GC.bnNum(filtered.length) + ' টি নোটিশ'
        : '';
    }
    renderPager(totalPages);
    syncUrl();
  }

  function buildChips() {
    if (!chipBox) return;
    var cats = [];
    all.forEach(function (n) { if (n.category && cats.indexOf(n.category) === -1) cats.push(n.category); });
    cats.sort();
    GC.clear(chipBox);

    ['সব'].concat(cats).forEach(function (label) {
      var value = label === 'সব' ? '' : label;
      var chip = GC.el('button', {
        type: 'button', class: 'gc-filter-chip', text: label,
        'aria-pressed': String(category === value)
      });
      chip.addEventListener('click', function () {
        category = value; page = 1;
        GC.qsa('.gc-filter-chip', chipBox).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        draw();
      });
      chipBox.appendChild(chip);
    });
  }

  var debounce;
  if (searchI) {
    searchI.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { query = searchI.value.trim(); page = 1; draw(); }, 150);
    });
  }

  // Restore state from the URL so filtered views are shareable.
  var params = new URLSearchParams(location.search);
  query    = params.get('q') || '';
  category = params.get('category') || '';
  page     = Math.max(1, parseInt(params.get('page'), 10) || 1);
  if (searchI && query) searchI.value = query;

  GC.render({
    url: 'data/notices.json',
    mount: mount,
    loadingMessage: 'নোটিশ লোড হচ্ছে…',
    onData: function (data) {
      all = sortNotices(data.notices || []);
      buildChips();
      draw();
    }
  });
}());
