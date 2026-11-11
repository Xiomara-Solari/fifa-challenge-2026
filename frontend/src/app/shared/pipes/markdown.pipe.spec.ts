import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('devuelve cadena vacía ante valores nulos o vacíos', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('convierte encabezados, negritas, listas y saltos de línea a HTML', () => {
    const markdown = [
      '### Punto de partida',
      'Evolución de **Lionel Messi**',
      'Primera línea\nSegunda línea',
      '- Ritmo: 93\n- Regate: 96'
    ].join('\n\n');

    const html = pipe.transform(markdown);

    expect(html).toContain('<h3>Punto de partida</h3>');
    expect(html).toContain('<strong>Lionel Messi</strong>');
    expect(html).toContain('<br>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Ritmo: 93</li>');
  });

  it('elimina etiquetas y atributos peligrosos (protección XSS)', () => {
    const malicious = [
      'Texto válido',
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">clic</a>'
    ].join('\n\n');

    const html = pipe.transform(malicious);

    expect(html).toContain('<p>Texto válido</p>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
  });
});
