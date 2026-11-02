'use strict';
var isEnglish = document.documentElement.lang === 'en';
// Keep language changes at the same place in the article, even after manual scrolling.
// Animate intentional section navigation without animating page loads or history restore.
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var hash = link.getAttribute('href');
    var section = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!section) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    section.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
    if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
    section.focus({preventScroll: true});
  });
});
var languagePositionKey = 'specopd-language-position';
var readingAnchors = Array.from(document.querySelectorAll('#top, .prologue, .article-section, #code, #citation, #acknowledgments'));
function currentReadingAnchor() {
  var anchor = document.getElementById('top');
  readingAnchors.forEach(function(item) {
    if (item.id && item.getBoundingClientRect().top <= 100) anchor = item;
  });
  // The language controls live in the header. Keep the selected chapter when
  // returning to that header instead of treating it as a request to start over.
  if (anchor.id === 'top' && location.hash && location.hash !== '#top') {
    var selectedChapter = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (selectedChapter) anchor = selectedChapter;
  }
  var bounds = anchor.getBoundingClientRect();
  return {id: anchor.id, ratio: Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1)))};
}
document.querySelectorAll('.language-switch').forEach(function(link) {
  link.addEventListener('click', function(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var target = new URL(link.getAttribute('href'), window.location.href);
    if (target.pathname === window.location.pathname) {event.preventDefault(); return;}
    var position = currentReadingAnchor();
    target.hash = position.id === 'top' ? '' : position.id;
    link.href = target.href;
    try {
      sessionStorage.setItem(languagePositionKey, JSON.stringify({path: target.pathname, id: position.id, ratio: position.ratio, time: Date.now()}));
    } catch (error) { /* The section link also works without browser storage. */ }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      event.preventDefault();
      document.documentElement.classList.add('language-leaving');
      window.setTimeout(function() {window.location.assign(target.href);}, 120);
      window.setTimeout(function() {document.documentElement.classList.remove('language-leaving');}, 1800);
    }
  });
});
try {
  var savedLanguagePosition = JSON.parse(sessionStorage.getItem(languagePositionKey) || 'null');
  if (savedLanguagePosition && savedLanguagePosition.path === location.pathname && Date.now() - savedLanguagePosition.time < 30000) {
    sessionStorage.removeItem(languagePositionKey);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('language-arriving');
    var restoredAnchor = document.getElementById(savedLanguagePosition.id);
    if (restoredAnchor) {
      var root = document.documentElement;
      var priorScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      var restoredBounds = restoredAnchor.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + restoredBounds.top + savedLanguagePosition.ratio * restoredBounds.height);
      root.style.scrollBehavior = priorScrollBehavior;
    }
  }
} catch (error) { /* A normal page navigation remains the fallback. */ }
document.querySelectorAll('[data-copy-target]').forEach(function(button) {
  button.addEventListener('click', async function() {
    var content = document.getElementById(button.dataset.copyTarget).textContent;
    var status = document.querySelector('.copy-status');
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        var range = document.createRange();
        range.selectNodeContents(document.getElementById(button.dataset.copyTarget));
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        if (!document.execCommand('copy')) throw new Error('copy unavailable');
        selection.removeAllRanges();
      }
      button.textContent = isEnglish ? 'Copied' : '已复制';
      status.textContent = isEnglish ? 'Copied to clipboard.' : '已复制到剪贴板。';
    } catch (error) {
      status.textContent = isEnglish ? 'Select the text to copy it, or download the .bib file.' : '可选中文字手动复制，或下载 .bib 文件。';
    }
  });
});
var histories = {
  a: {prefix: ['Enjoy', 'a'], tokens: ['short', 'evening', 'walk']},
  evening: {prefix: ['Enjoy', 'a', 'quiet', 'evening'], tokens: ['with', 'soft', 'music']}
};
document.querySelectorAll('.token').forEach(function(button) {
  button.addEventListener('click', function() {
    document.querySelectorAll('.token').forEach(function(item) {item.setAttribute('aria-pressed', String(item === button));});
    var branch = histories[button.dataset.branch];
    var index = Number(button.dataset.index);
    document.getElementById('predicted-token').textContent = branch.tokens[index];
    document.getElementById('target-history').textContent = branch.prefix.concat(branch.tokens.slice(0, index)).join(' ');
  });
});
var dialog = document.querySelector('.image-dialog');
document.querySelectorAll('.figure-open').forEach(function(button) {
  button.addEventListener('click', function() {
    var source = button.querySelector('img');
    document.getElementById('dialog-image').src = source.src;
    document.getElementById('dialog-image').alt = source.alt;
    document.getElementById('download-image').href = source.src;
    document.getElementById('dialog-image-title').textContent = source.alt;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
document.querySelector('.dialog-close').addEventListener('click', function() {dialog.close();});
dialog.addEventListener('close', function() {document.body.style.overflow = '';});
dialog.addEventListener('click', function(event) {if (event.target === dialog) dialog.close();});
var links = Array.from(document.querySelectorAll('.contents nav a'));
var sections = Array.from(document.querySelectorAll('.article-section'));
var progress = document.querySelector('.reading-progress');
var scheduled = false;
function updateReadingPosition() {
  var max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (max > 0 ? window.scrollY / max * 100 : 0) + '%';
  var active = sections[0].id;
  sections.forEach(function(section) {if (section.getBoundingClientRect().top < 180) active = section.id;});
  links.forEach(function(link) {
    if (link.getAttribute('href') === '#' + active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scheduled = false;
}
window.addEventListener('scroll', function() {if (!scheduled) {scheduled = true; window.requestAnimationFrame(updateReadingPosition);}}, {passive:true});
updateReadingPosition();
