# 🔥 CONFIGURAÇÃO MANUAL DO FIREWALL

## 🎯 **SE O SCRIPT NÃO FUNCIONAR:**

### **OPÇÃO 1: Via Interface Gráfica**

#### **1. Abrir Firewall:**
- **Windows + R** → `wf.msc` → **Enter**

#### **2. Criar Regra de Bloqueio:**
1. **Clique:** "Regras de Entrada" (lado esquerdo)
2. **Clique:** "Nova Regra..." (lado direito)
3. **Selecione:** "Personalizada" → **Avançar**
4. **Programa:** "Todos os programas" → **Avançar**
5. **Protocolo:** "TCP" → **Avançar**
6. **Escopo:** 
   - **IPs Locais:** "Qualquer endereço IP"
   - **IPs Remotos:** "Estes endereços IP" → **Adicionar:**
     - `192.168.0.0/16` (rede local)
     - `3.13.191.225` (Supabase)
     - `52.5.144.89` (Supabase)
     - `54.83.108.243` (Supabase)
7. **Ação:** "Permitir conexão" → **Avançar**
8. **Perfil:** Marcar todos → **Avançar**
9. **Nome:** "Gran-Royalle-Allow" → **Concluir**

#### **3. Criar Regra de Bloqueio Geral:**
1. **Nova Regra** → "Personalizada"
2. **Programa:** "Todos os programas"
3. **Protocolo:** "TCP"
4. **Escopo:** "Qualquer endereço IP"
5. **Ação:** "Bloquear conexão"
6. **Nome:** "Gran-Royalle-Block-Others"

---

### **OPÇÃO 2: Comandos Individuais (Como Admin)**

Abrir **CMD como Administrador** e executar:

```cmd
REM Permitir Supabase
netsh advfirewall firewall add rule name="Supabase-1" dir=in action=allow protocol=TCP remoteip=3.13.191.225

netsh advfirewall firewall add rule name="Supabase-2" dir=in action=allow protocol=TCP remoteip=52.5.144.89

netsh advfirewall firewall add rule name="Supabase-3" dir=in action=allow protocol=TCP remoteip=54.83.108.243

REM Permitir rede local
netsh advfirewall firewall add rule name="Rede-Local" dir=in action=allow protocol=TCP remoteip=192.168.0.0/16

REM Bloquear outros
netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound
```

---

### **OPÇÃO 3: Segurança Simplificada (Temporária)**

**Se o firewall for muito complexo**, podemos usar **segurança por senha** no próprio script:

```python
# Adicionar no início do windows_polling_service_final.py
ALLOWED_IPS = ['192.168.', '127.0.0.1', '::1']
SECURITY_PASSWORD = "GranRoyalle2024"

def check_ip_security():
    # Verificar se o IP está na lista permitida
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    for allowed in ALLOWED_IPS:
        if local_ip.startswith(allowed):
            return True
    return False
```

---

## 🎯 **RECOMENDAÇÃO:**

1. **Tente:** Executar `configurar_firewall_windows.bat` **como ADMINISTRADOR**
2. **Se falhar:** Use **Opção 1** (interface gráfica)
3. **Se complexo:** Use **Opção 3** (segurança no código)

**O importante é que APENAS você e a rede local tenham acesso!** 🛡️
