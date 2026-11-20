// En el navegador: las fotos se achican antes de subirlas. La de un celular puede pesar más que el
// serverActions.bodySizeLimit de next.config.ts, y ahí Next.js corta el pedido con un error ("Body exceeded … limit")
// antes de llegar a la acción: la página se cae en vez de mostrar el mensaje.

/** El lado más largo de la foto que se sube: alcanza para verla a pantalla completa y pesa unos cientos de KB. */
const MAX_SIDE = 1600;

/**
 * Achica la foto y la pasa a JPEG. Así entran varias aunque el celular las saque de 8 MB, y de paso se pierden los
 * datos que trae (la ubicación, el modelo del celular): el lienzo sólo copia los píxeles.
 */
export async function shrinkPhoto(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file); // respeta la rotación de la cámara (EXIF)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
  if (!blob) throw new Error("toBlob");
  return blob;
}

const isPhoto = (v: FormDataEntryValue): v is File => v instanceof File && v.size > 0 && v.type.startsWith("image/");

/**
 * Las fotos de un formulario, achicadas, en el mismo lugar. La que no se puede leer va como vino: el servidor revisa el
 * tamaño y el tipo, y lo dice.
 */
export async function shrinkPhotos(data: FormData) {
  for (const key of new Set(data.keys())) {
    const values = data.getAll(key);
    if (!values.some(isPhoto)) continue;
    data.delete(key);
    for (const v of values) {
      const small = isPhoto(v) ? await shrinkPhoto(v).catch(() => null) : null;
      if (small) data.append(key, small, "foto.jpg");
      else data.append(key, v);
    }
  }
}
