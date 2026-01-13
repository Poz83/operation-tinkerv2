export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
