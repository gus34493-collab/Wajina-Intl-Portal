import os

file_path = 'primary-parent-dashboard.html'
script_to_inject = """    <script>
        // RBAC: Primary Parent Dashboard
        window.REQUIRED_ROLES = ['DIRECTOR', 'PARENT'];
        window.REQUIRED_CAMPUS = 'PRIMARY';
    </script>
    <script src="/js/auth-guard.js"></script>\n"""

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

new_lines = []
injected = False
for line in lines:
    if '<head>' in line and not injected:
        new_lines.append(line)
        new_lines.append(script_to_inject)
        injected = True
    elif 'auth-guard.js' in line:
        # Avoid double injection or clean up existing
        continue
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully updated primary-parent-dashboard.html")
