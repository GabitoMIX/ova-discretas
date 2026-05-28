const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Listado de manuales a procesar
const manuals = [
  {
    src: 'manuales/manual_usuario.md',
    dest: 'manuales/manual_usuario.pdf',
    title: 'Manual de Usuario'
  },
  {
    src: 'manuales/manual_implementacion.md',
    dest: 'manuales/manual_implementacion.pdf',
    title: 'Manual de Implementación'
  },
  {
    src: 'manuales/manual_codigo_arquitectura.md',
    dest: 'manuales/manual_codigo_arquitectura.pdf',
    title: 'Manual de Código y Arquitectura'
  }
];

// Colores del sistema de diseño institucional de la Unisimón
const COLOR_PRIMARY = '#09843B';  // Verde esmeralda institucional
const COLOR_ACCENT = '#D97706';   // Naranja corporativo
const COLOR_INK = '#1E293B';      // Gris oscuro para el texto
const COLOR_MUTED = '#64748B';    // Gris medio para subtítulos y metas
const COLOR_BG_CODE = '#F1F5F9';  // Fondo gris suave para código
const COLOR_BORDER = '#E2E8F0';   // Gris claro para líneas divisorias

function convertMarkdownToPdf(manual) {
  console.log(`Convirtiendo ${manual.src} a PDF...`);
  
  const srcPath = path.join(__dirname, manual.src);
  const destPath = path.join(__dirname, manual.dest);
  
  if (!fs.existsSync(srcPath)) {
    console.error(`Error: No se encontró el archivo origen en ${srcPath}`);
    return;
  }
  
  const content = fs.readFileSync(srcPath, 'utf8');
  
  // Crear documento PDF con márgenes estándar y tamaño carta
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 },
    bufferPages: true // Habilita búfer para poder calcular el total de páginas en el pie
  });
  
  const writeStream = fs.createWriteStream(destPath);
  doc.pipe(writeStream);
  
  // Parseo línea por línea
  const lines = content.split(/\r?\n/);
  
  // Portada del Manual
  doc.fillColor(COLOR_PRIMARY);
  doc.rect(54, 54, 504, 8).fill(); // Barra verde superior decorativa
  
  doc.moveDown(4);
  doc.font('Times-Bold').fontSize(14).fillColor(COLOR_MUTED).text('UNIVERSIDAD SIMÓN BOLÍVAR', { align: 'center', characterSpacing: 1 });
  doc.font('Times-Bold').fontSize(12).text('FACULTAD DE INGENIERÍA DE SISTEMAS', { align: 'center', characterSpacing: 0.5 });
  doc.moveDown(2);
  
  doc.font('Times-Bold').fontSize(26).fillColor(COLOR_PRIMARY).text(manual.title.toUpperCase(), { align: 'center' });
  doc.moveDown(1);
  
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLOR_INK).text('Matemáticas Discretas para Ingeniería de Sistemas', { align: 'center' });
  doc.font('Helvetica').fontSize(11).fillColor(COLOR_MUTED).text('Objeto Virtual de Aprendizaje (OVA) Interactivo', { align: 'center' });
  
  doc.moveDown(6);
  doc.fillColor(COLOR_BORDER);
  doc.rect(100, doc.y, 412, 1).fill(); // Línea divisoria
  doc.moveDown(2);
  
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_INK).text('DOCUMENTO TÉCNICO OFICIAL', { align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor(COLOR_MUTED).text('Cúcuta, Colombia • 2026', { align: 'center' });
  
  doc.addPage(); // Empezar contenido en la siguiente página
  
  let inCodeBlock = false;
  let codeBlockLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Gestión de Bloques de Código
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Renderizar bloque de código acumulado
        inCodeBlock = false;
        doc.fillColor(COLOR_BG_CODE);
        const codeText = codeBlockLines.join('\n');
        
        // Calcular alto del bloque
        const codeHeight = doc.heightOfString(codeText, { width: 504, font: 'Courier', size: 8.5 });
        
        // Agregar página si no cabe
        if (doc.y + codeHeight + 10 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }
        
        const startY = doc.y;
        doc.rect(54, startY, 504, codeHeight + 12).fill();
        
        doc.fillColor(COLOR_INK);
        doc.font('Courier').fontSize(8.5).text(codeText, 60, startY + 6, { width: 492, lineGap: 2 });
        doc.moveDown(1.5);
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }
    
    // Títulos de nivel 1 ( # )
    if (trimmed.startsWith('# ')) {
      const text = trimmed.slice(2);
      doc.moveDown(1.5);
      doc.font('Times-Bold').fontSize(20).fillColor(COLOR_PRIMARY).text(text);
      doc.moveDown(0.5);
      continue;
    }
    
    // Títulos de nivel 2 ( ## )
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3);
      doc.moveDown(1.2);
      doc.font('Times-Bold').fontSize(15).fillColor(COLOR_PRIMARY).text(text);
      doc.moveDown(0.4);
      continue;
    }
    
    // Títulos de nivel 3 ( ### )
    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4);
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR_ACCENT).text(text);
      doc.moveDown(0.3);
      continue;
    }
    
    // Horizontales ( --- ) -> Salto de página
    if (trimmed === '---') {
      doc.addPage();
      continue;
    }
    
    // Listas ( * o - )
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      let text = trimmed.slice(2);
      // Limpiar asteriscos de negritas simples en el texto (ej. **Texto** -> Texto)
      text = text.replace(/\*\*(.*?)\*\*/g, '$1');
      doc.font('Helvetica').fontSize(10.5).fillColor(COLOR_INK);
      doc.text('•', 70, doc.y, { continued: true });
      doc.text(`  ${text}`, 80, doc.y, { width: 478, lineGap: 3 });
      doc.moveDown(0.2);
      continue;
    }
    
    // Párrafo normal
    if (trimmed.length > 0) {
      let text = trimmed;
      // Limpiar negritas
      text = text.replace(/\*\*(.*?)\*\*/g, '$1');
      
      // Chequear si el párrafo cabe en la página
      const paraHeight = doc.heightOfString(text, { width: 504, font: 'Helvetica', size: 10.5, lineGap: 3 });
      if (doc.y + paraHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
      
      doc.font('Helvetica').fontSize(10.5).fillColor(COLOR_INK).text(text, 54, doc.y, { width: 504, align: 'justify', lineGap: 3 });
      doc.moveDown(0.6);
    } else {
      doc.moveDown(0.3);
    }
  }
  
  // Agregar encabezados y pies de página dinámicos a todas las páginas (excepto la portada)
  const range = doc.bufferedPageRange();
  for (let i = range.start + 1; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    
    // Encabezado
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLOR_MUTED).text('UNIVERSIDAD SIMÓN BOLÍVAR • DEPARTAMENTO DE MATEMÁTICAS DISCRETAS', 54, 30);
    doc.font('Helvetica').fontSize(7.5).text(`OVA Interactivo - ${manual.title}`, 54, 39, { align: 'right', width: 504 });
    doc.fillColor(COLOR_BORDER).rect(54, 46, 504, 0.5).fill();
    
    // Pie de página
    doc.fillColor(COLOR_BORDER).rect(54, doc.page.height - 40, 504, 0.5).fill();
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED).text(`Página ${i} de ${range.count - 1}`, 54, doc.page.height - 33, { align: 'center', width: 504 });
  }
  
  doc.end();
  console.log(`¡Éxito! PDF guardado en: ${manual.dest}`);
}

// Procesar todos los manuales secuencialmente
manuals.forEach(convertMarkdownToPdf);
console.log('Todos los manuales PDF se han generado correctamente.');
