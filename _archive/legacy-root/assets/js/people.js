/* teachers.html + committee.html — both render the same person card. */
(function () {
  'use strict';
  var GC = window.GC;
  var mount = GC.qs('#peopleList');
  if (!mount) return;

  var url = mount.getAttribute('data-source');
  var key = mount.getAttribute('data-key');
  var emptyMsg = mount.getAttribute('data-empty') || 'তথ্য শীঘ্রই যুক্ত করা হবে।';

  function card(p) {
    var photo = p.photo
      ? GC.el('img', { class: 'gc-person-photo', src: p.photo, alt: p.name, loading: 'lazy' })
      : GC.el('div', { class: 'gc-person-initial', 'aria-hidden': 'true', text: GC.initials(p.name) });

    var inner = [photo, GC.el('h3', { text: p.name })];
    if (p.nameEn)      inner.push(GC.el('p', { class: 'text-muted small mb-1', lang: 'en', text: p.nameEn }));
    if (p.designation) inner.push(GC.el('p', { class: 'gc-person-role', text: p.designation }));
    if (p.subject)     inner.push(GC.el('p', { class: 'gc-person-note', text: 'বিষয়: ' + p.subject }));
    if (p.note)        inner.push(GC.el('p', { class: 'gc-person-note', text: p.note }));

    return GC.el('div', { class: 'col-12 col-sm-6 col-lg-4' }, [
      GC.el('div', { class: 'gc-card gc-person h-100' }, inner)
    ]);
  }

  GC.render({
    url: url,
    mount: mount,
    onData: function (data) {
      var list = data[key] || [];
      if (!list.length) { mount.appendChild(GC.stateEmpty(emptyMsg)); return; }
      var row = GC.el('div', { class: 'row g-4' });
      list.forEach(function (p) { row.appendChild(card(p)); });
      mount.appendChild(row);
    }
  });
}());
