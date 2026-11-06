/* notice-view.html — renders one notice's Markdown body, safely. */
(function () {
  'use strict';
  var GC = window.GC;

  var mount = GC.qs('#noticeArticle');
  if (!mount) return;

  var id = new URLSearchParams(location.search).get('id');

  /* One hardened sanitize config for the whole site.
     h1 is deliberately excluded — the page owns its single <h1>. */
  var PURIFY_CONFIG = {
    ALLOWED_TAGS: ['p','br','hr','strong','em','del','blockquote','code','pre',
                   'h2','h3','h4','h5','ul','ol','li','a','img',
                   'table','thead','tbody','tr','th','td'],
    ALLOWED_ATTR: ['href','title','src','alt','colspan','rowspan','loading'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style','form','input','iframe','script','object','embed']
  };

  if (window.DOMPurify) {
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName === 'A' && node.getAttribute('href') &&
          /^https?:/i.test(node.getAttribute('href'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
      if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
    });
  }

  function renderMarkdown(md) {
    var html = window.marked
      ? marked.parse(md || '', { gfm: true, breaks: true })
      : String(md || '');
    return window.DOMPurify ? DOMPurify.sanitize(html, PURIFY_CONFIG) : '';
  }

  function setMeta(name, value, attr) {
    var sel = '[' + (attr || 'name') + '="' + name + '"]';
    var tag = GC.qs('meta' + sel);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr || 'name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', value);
  }

  /* The <h1> lives in the HTML, not here, so the page has a real heading
     before (and without) JavaScript. */
  function setHeading(text, badge) {
    var h1 = GC.qs('#noticeTitle');
    if (!h1) return;
    h1.textContent = text;
    if (badge) h1.appendChild(GC.el('span', { class: 'gc-badge-new', text: 'নতুন' }));
  }

  function notFound(message) {
    document.title = 'নোটিশ পাওয়া যায়নি | ঘোনার চালা উচ্চ বিদ্যালয়';
    setMeta('robots', 'noindex');            // don't let dead ids into the index
    setHeading('নোটিশটি পাওয়া যায়নি');
    GC.clear(mount);
    mount.appendChild(GC.el('div', { class: 'gc-state gc-state--error' }, [
      GC.el('i', { class: 'bi bi-file-earmark-x', 'aria-hidden': 'true' }),
      GC.el('p', { class: 'mb-0', text: message || 'আপনি যে নোটিশটি খুঁজছেন সেটি সরিয়ে ফেলা হয়েছে বা ঠিকানাটি ভুল।' }),
      GC.el('div', { class: 'mt-3' }, [
        GC.el('a', { class: 'btn btn-primary btn-sm', href: 'notices.html', text: 'সকল নোটিশ দেখুন' })
      ])
    ]));
  }

  function renderNotice(n) {
    document.title = n.title + ' | ঘোনার চালা উচ্চ বিদ্যালয়';

    var summary = String(n.body || '').replace(/[#*_`>\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    setMeta('description', summary);
    setMeta('og:title', n.title, 'property');
    setMeta('og:description', summary, 'property');

    var canonical = GC.qs('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://gchighschool.edu.bd/notice-view.html?id=' + encodeURIComponent(n.id);

    var crumb = GC.qs('#crumbCurrent');
    if (crumb) crumb.textContent = n.title;

    setHeading(n.title, GC.isNew(n.date));

    var meta = GC.el('div', { class: 'gc-notice-meta mb-4 pb-3 border-bottom' }, [
      GC.el('span', {}, [
        GC.el('i', { class: 'bi bi-calendar3 me-1', 'aria-hidden': 'true' }),
        'প্রকাশকাল: ', GC.timeEl(n.date)
      ])
    ]);
    if (n.category) meta.appendChild(GC.el('span', { class: 'gc-chip', text: n.category }));
    if (n.titleEn) meta.appendChild(GC.el('span', { class: 'text-muted', lang: 'en', text: n.titleEn }));

    var body = GC.el('div', { class: 'gc-md', html: renderMarkdown(n.body) });

    var children = [meta, body];

    if (n.attachment && n.attachment.url) {
      children.push(GC.el('div', { class: 'mt-4 p-3 rounded border bg-white' }, [
        GC.el('i', { class: 'bi bi-paperclip me-2', 'aria-hidden': 'true' }),
        GC.el('a', { href: n.attachment.url, class: 'fw-semibold',
                     text: n.attachment.label || 'সংযুক্তি ডাউনলোড করুন' })
      ]));
    }

    children.push(GC.el('div', { class: 'mt-4 pt-3 border-top' }, [
      GC.el('a', { class: 'btn btn-outline-primary btn-sm', href: 'notices.html' }, [
        GC.el('i', { class: 'bi bi-arrow-left me-1', 'aria-hidden': 'true' }), 'সকল নোটিশ'
      ])
    ]));

    GC.clear(mount);
    children.forEach(function (c) { mount.appendChild(c); });
  }

  if (!id) { notFound('কোনো নোটিশ নির্দিষ্ট করা হয়নি।'); return; }

  GC.render({
    url: 'data/notices.json',
    mount: mount,
    loadingMessage: 'নোটিশ লোড হচ্ছে…',
    onData: function (data) {
      var list = data.notices || [];
      var found = null;
      for (var i = 0; i < list.length; i++) {
        if (String(list[i].id) === String(id)) { found = list[i]; break; }
      }
      if (found) renderNotice(found);
      else notFound();
    }
  });
}());
