import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { File } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
export const mediaDir = path.resolve(dirname, '../../../../wordpress-media')

export function readLocalFile(filename: string, mimetype?: string): File {
  const filePath = path.resolve(mediaDir, filename)
  const data = fs.readFileSync(filePath)
  const ext = path.extname(filename).replace('.', '')
  return {
    name: filename,
    data: Buffer.from(data),
    mimetype: mimetype || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    size: data.byteLength,
  }
}

export function textToLexical(text: string) {
  const paragraphs = text.split('\n\n').filter(Boolean)
  return {
    root: {
      type: 'root',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal' as const, style: '', text: p.trim(), version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export function heading(text: string, tag: 'h2' | 'h3' | 'h4' = 'h2') {
  return {
    type: 'heading',
    tag,
    children: [
      { type: 'text', detail: 0, format: 0, mode: 'normal' as const, style: '', text, version: 1 },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

export function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [
      { type: 'text', detail: 0, format: 0, mode: 'normal' as const, style: '', text, version: 1 },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

export function boldParagraph(boldText: string, normalText: string = '') {
  const children: any[] = [
    { type: 'text', detail: 0, format: 1, mode: 'normal' as const, style: '', text: boldText, version: 1 },
  ]
  if (normalText) {
    children.push({
      type: 'text',
      detail: 0,
      format: 0,
      mode: 'normal' as const,
      style: '',
      text: normalText,
      version: 1,
    })
  }
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

export function richTextFromNodes(children: any[]) {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
