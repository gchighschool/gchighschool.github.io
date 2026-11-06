/* index.html — homepage notice board widget (top 5). */
(function () {
  'use strict';
  var GC = window.GC;
  var mount = GC.qs('#homeNotices');
  if (!mount) return;

  GC.render({
    url: 'data/notices.json',
    mount: mount,
    loadingMessage: 'নোটিশ লোড হচ্ছে…',
    onData: function (data) {
      var list = (data.notices || []).slice().sort(function (a, b) {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
        return a.date < b.date ? 1 : -1;
      }).slice(0, 5);

      if (!list.length) { mount.appendChild(GC.stateEmpty('এখনো কোনো নোটিশ নেই।')); return; }

      list.forEach(function (n) {
        var title = GC.el('span', { class: 'gc-nb-title', text: n.title });
        if (n.pinned) {
          title.insertBefore(GC.el('i', { class: 'bi bi-pin-angle-fill gc-badge-pin', 'aria-hidden': 'true' }),
                             title.firstChild);
        }
        if (GC.isNew(n.date)) title.appendChild(GC.el('span', { class: 'gc-badge-new', text: 'নতুন' }));

        mount.appendChild(GC.el('a', {
          class: 'gc-nb-item',
          href: 'notice-view.html?id=' + encodeURIComponent(n.id)
        }, [title, GC.el('span', { class: 'gc-nb-date' }, [GC.timeEl(n.date)])]));
      });
    }
  });
}());
