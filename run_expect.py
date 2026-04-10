import os
import subprocess

script = """#!/usr/bin/expect -f

set timeout -1
set host "165.22.216.160"
set user "root"
set password "P@s$w0rd-12345!"

spawn ssh $user@$host

expect {
    "yes/no" { send "yes\\r"; exp_continue }
    "*assword:*" { send "$password\\r" }
}

expect "*#*"

send "cat > /root/agents/deploy.sh << 'EOF'\\n"
send "#!/bin/bash\\n"
send "export PATH=\\$PATH:/root/.nvm/versions/node/v20.11.1/bin:/usr/local/bin:/usr/bin:/bin\\n"
send "if ! command -v npm &> /dev/null; then\\n"
send "  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs\\n"
send "fi\\n"
send "npm install -g pnpm pm2\\n"
send "PROJECT_DIR=\\"/root/Projects/auto-maktab-crm/backend\\"\\n"
send "if [ ! -d \\"\\$PROJECT_DIR\\" ]; then\\n"
send "  PROJECT_DIR=\\"/root/Projects/auto-maktab/backend\\"\\n"
send "fi\\n"
send "cd \\"\\$PROJECT_DIR\\"\\n"
send "git pull origin main || git pull\\n"
send "pnpm install\\n"
send "pnpm prisma:generate\\n"
send "pnpm prisma:migrate deploy || pnpm prisma:push\\n"
send "pnpm run build\\n"
send "pm2 restart automaktab-backend || pm2 start dist/main.js --name \\"automaktab-backend\\"\\n"
send "pm2 save\\n"
send "echo \\"=> Deployment complete!\\"\\n"
send "EOF\\r"

expect "*#*"
send "chmod +x /root/agents/deploy.sh\\r"
expect "*#*"
send "/root/agents/deploy.sh\\r"
expect "*#*"
send "exit\\r"
expect eof
"""

with open('/Users/admin/Developer/Projects/auto-maktab-crm/backend/deploy-remote.exp', 'w') as f:
    f.write(script)

os.chmod('/Users/admin/Developer/Projects/auto-maktab-crm/backend/deploy-remote.exp', 0o755)
print("Script written, executing...")
subprocess.run(['/usr/bin/expect', '-f', '/Users/admin/Developer/Projects/auto-maktab-crm/backend/deploy-remote.exp'], check=True)
