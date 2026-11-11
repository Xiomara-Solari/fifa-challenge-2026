import { Pipe, PipeTransform } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const ALLOWED_MARKDOWN_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'del',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a'
];

const ALLOWED_MARKDOWN_ATTRS = ['href', 'title', 'target', 'rel'];

/**
 * Transforma texto Markdown a HTML seguro combinando `marked` y `DOMPurify`
 * antes de inyectarlo en el DOM mediante `[innerHTML]`.
 */
@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const rawHtml = marked.parse(value, {
      async: false,
      gfm: true,
      breaks: true
    });

    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ALLOWED_MARKDOWN_TAGS,
      ALLOWED_ATTR: ALLOWED_MARKDOWN_ATTRS,
      ALLOW_ARIA_ATTR: false,
      ALLOW_DATA_ATTR: false
    });
  }
}
