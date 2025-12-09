export const resizeImage = (
  file: File,
  maxWidth: number = 1024,
  quality: number = 0.8
): Promise<{ resizedFile: File; base64: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas.'));
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Falha ao criar blob da imagem redimensionada.'));
            }
            const resizedFile = new File([blob], 'resized.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({ resizedFile, base64 });
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(new Error('Falha ao carregar a imagem para redimensionamento.'));
    };
    reader.onerror = (err) => reject(new Error('Falha ao ler o arquivo de imagem.'));
  });
};