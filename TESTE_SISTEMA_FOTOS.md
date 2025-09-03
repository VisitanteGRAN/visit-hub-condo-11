# 📸 TESTE DO SISTEMA COM FOTOS - GUIA RÁPIDO

## 🎯 **OBJETIVO:**
Testar o sistema completo de automação HikCentral com upload de fotos para reconhecimento facial.

---

## 🛠️ **PREPARAÇÃO:**

### **1. Instalar Dependências:**
```bash
cd visit-hub-condo-11
pip install Pillow psutil Flask Flask-CORS
```

### **2. Criar Diretórios:**
```bash
mkdir -p photos temp logs screenshots
```

### **3. Testar Photo Manager:**
```bash
python3 photo_manager.py
```

---

## 🧪 **TESTES INDIVIDUAIS:**

### **TESTE 1: Salvar Foto Base64**
```python
from photo_manager import save_visitor_photo

# Foto de teste (pequena imagem base64)
test_base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

result = save_visitor_photo("test123", test_base64, {"nome": "João Teste"})
print(f"Resultado: {result}")
```

### **TESTE 2: API de Upload de Foto**
```bash
curl -X POST http://localhost:5001/api/hikcentral/photo/test123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hik_automation_2024_secure_key" \
  -d '{
    "photo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "metadata": {"nome": "João Teste"}
  }'
```

### **TESTE 3: Script com Foto**
```bash
# Criar arquivo de teste com foto
echo '{
  "name": "João da Silva Foto",
  "phone": "11999999999", 
  "rg": "12345678",
  "placa": "ABC1234",
  "photo_path": "./photos/test123_*.jpg"
}' > /tmp/test_visitor_data.json

# Executar script
python3 test_real_hikcentral_automated.py \
  --visitor-data /tmp/test_visitor_data.json \
  --visitor-id test123 \
  --headless
```

---

## 🌐 **TESTE COMPLETO DA API:**

### **1. Iniciar Servidor:**
```bash
python3 automation_server_production.py
```

### **2. Testar Health Check:**
```bash
curl http://localhost:5001/api/health
```

### **3. Automação Completa com Foto:**
```bash
curl -X POST http://localhost:5001/api/hikcentral/automation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hik_automation_2024_secure_key" \
  -d '{
    "visitor_id": "visitor_foto_123",
    "visitor_data": {
      "name": "Ana Silva Com Foto",
      "phone": "11987654321",
      "rg": "87654321", 
      "placa": "XYZ9876",
      "photo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    }
  }'
```

### **4. Verificar Status:**
```bash
curl -H "Authorization: Bearer hik_automation_2024_secure_key" \
     http://localhost:5001/api/hikcentral/status/visitor_foto_123
```

### **5. Recuperar Foto:**
```bash
curl -H "Authorization: Bearer hik_automation_2024_secure_key" \
     http://localhost:5001/api/hikcentral/photo/visitor_foto_123
```

---

## 🎭 **TESTE NO FRONTEND:**

### **1. Configurar Variáveis:**
```bash
# .env.local
echo "VITE_AUTOMATION_SERVER_URL=http://localhost:5001" > .env.local
echo "VITE_AUTOMATION_API_KEY=hik_automation_2024_secure_key" >> .env.local
```

### **2. Testar Component:**
```typescript
import automationService from '@/services/automationService';

// Teste de captura de foto
const testPhotoCapture = async () => {
  const photo = await automationService.capturePhotoFromWebcam();
  console.log('Foto capturada:', photo ? 'Sucesso' : 'Falha');
};

// Teste de automação completa
const testFullAutomation = async () => {
  const visitorId = automationService.generateVisitorId('João Teste', '12345678901');
  
  const result = await automationService.startAutomation(visitorId, {
    name: 'João Teste com Foto',
    phone: '11999999999',
    rg: '12345678',
    photo_base64: 'data:image/jpeg;base64,/9j/4AAQ...' // sua foto aqui
  });
  
  console.log('Automação:', result);
};
```

---

## 🔍 **VERIFICAÇÕES DE SUCESSO:**

### **✅ Photo Manager:**
- [ ] Fotos salvas em `./photos/`
- [ ] Metadados salvos em JSON
- [ ] Redimensionamento funcionando
- [ ] Base64 convertido corretamente

### **✅ Servidor de Automação:**
- [ ] `/api/health` retorna 200
- [ ] Upload de foto via API funciona
- [ ] `photo_received: true` na resposta
- [ ] Foto salva no servidor

### **✅ Script de Automação:**
- [ ] Script reconhece `photo_path` nos dados
- [ ] Upload da foto no HikCentral funciona
- [ ] Cadastro completo com foto
- [ ] Logs mostram "Foto enviada"

### **✅ Frontend:**
- [ ] Captura de webcam funciona
- [ ] Upload de arquivo funciona
- [ ] Preview da foto exibido
- [ ] Automação inclui foto
- [ ] Status em tempo real

---

## 🐛 **PROBLEMAS COMUNS:**

### **Problema: "Pillow não encontrado"**
```bash
pip install Pillow
```

### **Problema: "Pasta photos não existe"**
```bash
mkdir -p photos temp
```

### **Problema: "Webcam não funciona"**
- Verificar permissões do navegador
- Testar em HTTPS (para produção)
- Usar arquivo de foto como alternativa

### **Problema: "Upload falha no HikCentral"**
- Verificar se input[type="file"] existe na página
- Testar diferentes estratégias de upload
- Verificar logs do script

### **Problema: "Base64 muito grande"**
```typescript
// Redimensionar antes de enviar
const resized = await automationService.resizeImageBase64(
  originalBase64, 
  800, // width
  600, // height  
  0.7  // quality
);
```

---

## 📊 **LOGS A VERIFICAR:**

### **Photo Manager:**
```bash
tail -f logs/automation_server.log | grep "📸"
```

### **Script de Automação:**
```bash
# Procurar por mensagens de foto
grep -i "foto\|photo" logs/automation_server.log
```

### **Servidor Flask:**
```bash
# Logs do servidor
python3 automation_server_production.py
```

---

## 🎯 **FLUXO COMPLETO DE TESTE:**

1. **Preparar ambiente** (dependências, diretórios)
2. **Testar photo manager** individualmente  
3. **Iniciar servidor** de automação
4. **Fazer upload** de foto via API
5. **Executar automação** completa
6. **Verificar logs** de cada componente
7. **Confirmar cadastro** no HikCentral
8. **Testar frontend** (opcional)

---

## 🎉 **SUCESSO ESPERADO:**

```
✅ Foto salva no servidor: photos/visitor_123_timestamp.jpg
✅ Automação iniciada: {"success": true, "photo_received": true}
✅ Script executado: "📸 Foto enviada via input file direto"  
✅ Cadastro HikCentral: "✅ Clicado em 'Entrada' - Cadastro confirmado!"
✅ Status final: {"status": "completed"}
```

🚀 **Sistema com fotos funcionando perfeitamente!** 