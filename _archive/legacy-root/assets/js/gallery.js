/* gallery.html — grid + Bootstrap-modal lightbox (no lightbox library). */
(function () {
  'use strict';
  var GC = window.GC;
  var mount = GC.qs('#galleryGrid');
  if (!mount) return;

  var modalImg = GC.qs('#galleryModalImg');
  var modalCap = GC.qs('#galleryModalCaption');
  var modalEl  = GC.qs('#galleryModal');

  GC.render({
    url: 'data/gallery.json',
    mount: mount,
    loadingMessage: 'ছবি লোড হচ্ছে…',
    onData: function (data) {
      var photos = data.photos || [];
      if (!photos.length) { mount.appendChild(GC.stateEmpty('এখনো কোনো ছবি যুক্ত করা হয়নি।')); return; }

      var row = GC.el('div', { class: 'row g-3' });
      photos.forEach(function (p) {
        var fig = GC.el('figure', { class: 'gc-gallery-item mb-0' }, [
          GC.el('img', { src: p.thumb || p.src, alt: p.caption || 'বিদ্যালয়ের ছবি', loading: 'lazy' }),
          p.caption ? GC.el('figcaption', { text: p.caption }) : null
        ]);
        var btn = GC.el('button', {
          type: 'button', class: 'btn p-0 border-0 w-100 text-start bg-transparent',
          'aria-label': (p.caption || 'ছবি') + ' — বড় করে দেখুন'
        }, [fig]);

        btn.addEventListener('click', function () {
          if (!modalEl || !window.bootstrap) { window.open(p.src, '_blank', 'noopener'); return; }
          modalImg.src = p.src;
          modalImg.alt = p.caption || 'বিদ্যালয়ের ছবি';
          modalCap.textContent = p.caption || '';
          window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        });

        row.appendChild(GC.el('div', { class: 'col-6 col-md-4 col-lg-3' }, [btn]));
      });
      mount.appendChild(row);
    }
  });
}());
