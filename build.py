#!/usr/bin/env python3
"""Gộp src/index.html + css/ + js/ thành MỘT file HTML tự chạy.

  index.html             – bản đầy đủ, mở trực tiếp bằng trình duyệt / app xem file
  dist/task1-coach.html  – bản đăng lên claude.ai (không có <!doctype>/<html>/<head>/<body>)
  dist/vendor/           – bộ OCR dự phòng, đăng kèm trang

Chạy lại sau mỗi lần sửa:  python3 build.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
src = (ROOT / 'src/index.html').read_text(encoding='utf-8')

def inline_css(m):
    css = (ROOT / m.group(1)).read_text(encoding='utf-8')
    return '<style>\n' + css + '</style>'

def inline_js(m):
    js = (ROOT / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return '<script>\n' + js + '</script>'

html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, src)
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)
banner = '<!-- File được tạo tự động từ src/, css/, js/ bằng build.py — đừng sửa trực tiếp. -->\n'
(ROOT / 'index.html').write_text(html.replace('<html lang="vi">', banner + '<html lang="vi">', 1), encoding='utf-8')

head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'\s*<meta (charset|name="viewport")[^>]*>', '', head)
(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist/task1-coach.html').write_text(head.strip() + '\n' + body.strip() + '\n', encoding='utf-8')
# Bộ OCR dự phòng (Tesseract.js) được tải theo đường dẫn tương đối vendor/tesseract/
import shutil
shutil.copytree(ROOT / 'vendor', ROOT / 'dist/vendor', dirs_exist_ok=True)
print('OK: index.html, dist/task1-coach.html, dist/vendor/')
