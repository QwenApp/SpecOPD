'use strict';
var isEnglish = document.documentElement.lang === 'en';
document.querySelectorAll('.language-switch').forEach(function(link) {
  link.addEventListener('click', function() {
    var target = link.getAttribute('href').split('#')[0];
    link.setAttribute('href', target + window.location.hash);
  });
});
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
