from PIL import Image, ImageDraw, ImageFont
import os

# Criar uma imagem 200x200 com fundo azul claro
img = Image.new('RGB', (200, 200), color='lightblue')
draw = ImageDraw.Draw(img)

# Adicionar texto
try:
    # Tentar usar uma fonte do sistema
    font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 16)
except:
    # Usar fonte padrão se não encontrar
    font = ImageFont.load_default()

# Desenhar texto centralizado
text = "Foto de\nTeste"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

x = (200 - text_width) // 2
y = (200 - text_height) // 2

draw.text((x, y), text, fill='black', font=font)

# Salvar a imagem
img.save('test_photo.jpg')
print("✅ Foto de teste criada: test_photo.jpg") 