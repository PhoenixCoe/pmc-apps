import type { AppMeta } from '@/lib/types';

export const meta: AppMeta = {
  n: 14,
  category: "file-media",
  slug: "image-resizer",
  title: "Image Resizer",
  description: "Resize many images at once with locked aspect ratio, exact crops and quality compression.",
  tagline: "Resize many images",
  keywords: ["image resizer","bulk image resizer","resize photos online","compress images online","resize images for web","change image size","batch resize"],
  seoTitle: "Image Resizer: resize many images at once, free",
  seoDescription: "Free bulk image resizer. Resize, crop and compress photos in your browser, keep the shape, rename the files and download them all as one ZIP.",
  features: ["Resize many images at once","Keeps the shape (aspect ratio)","Save as JPEG, PNG or WebP","Choose the quality","Rename files","Download all as one ZIP"],
  mode: "local",
  faq: [
    { q: "How do I resize several photos at once?", a: "Drop them all in, choose the size, then download them as a ZIP. Every photo gets the same settings." },
    { q: "Are my photos uploaded anywhere?", a: "No. The resizing happens inside your browser, so your photos never leave your device." },
    { q: "How do I make an image file smaller?", a: "Lower the quality or the size, or save as WEBP or JPEG. You will see the new file size before you download." },
  ],
  built: true,
};
