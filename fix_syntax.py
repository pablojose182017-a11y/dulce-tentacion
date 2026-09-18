import sys

filepath = r'c:\Users\pablo.carrascal\Documents\dulce-tentacion\contabilidad.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r'\`', '`')
content = content.replace(r'\${', '${')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Global replace complete.')
