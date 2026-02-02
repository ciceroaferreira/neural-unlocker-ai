import { ReportData } from '@/types/export';
import { CATEGORY_LABELS } from '@/constants/questions';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// ── Markdown Export ──

export function generateMarkdownReport(data: ReportData): string {
  const lines: string[] = [];

  lines.push('# Relatório de Desbloqueio Neural');
  lines.push(`## Método IP - Neural Unlocker AI`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Informações da Sessão');
  lines.push('');
  lines.push(`- **Data:** ${formatDate(data.sessionMetadata.createdAt)}`);
  lines.push(`- **Duração:** ${formatDuration(data.sessionMetadata.durationSeconds)}`);
  lines.push(`- **Perguntas respondidas:** ${data.sessionMetadata.questionsAnswered} de ${data.sessionMetadata.totalQuestions}`);
  lines.push(`- **Relatório gerado em:** ${formatDate(data.generatedAt)}`);
  lines.push('');

  // Question Responses
  if (data.questionResponses.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('### Respostas às Perguntas');
    lines.push('');
    data.questionResponses.forEach((qr, i) => {
      const category = CATEGORY_LABELS[qr.category] || qr.category;
      lines.push(`#### ${i + 1}. [${category}] ${qr.questionText}`);
      lines.push('');
      lines.push(`> ${qr.userResponse}`);
      lines.push('');
    });
  }

  // Transcription
  lines.push('---');
  lines.push('');
  lines.push('### Transcrição Completa');
  lines.push('');
  data.transcription.forEach(m => {
    if (m.role === 'system') {
      lines.push(`**[PERGUNTA]** ${m.text}`);
    } else if (m.role === 'user') {
      lines.push(`**Usuário:** ${m.text}`);
    } else {
      lines.push(`**Neural Unlocker:** ${m.text}`);
    }
    lines.push('');
  });

  // Block Analysis
  if (data.blocks.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('### Análise de Bloqueios');
    lines.push('');
    data.blocks.forEach((block, i) => {
      lines.push(`#### Bloqueio #${i + 1}: ${block.blockName}`);
      lines.push('');
      lines.push(`- **Intensidade:** ${block.intensity}%`);
      lines.push(`- **Descrição:** ${block.description}`);
      lines.push('');
      if (block.recommendations.length > 0) {
        lines.push('**Recomendações:**');
        block.recommendations.forEach(rec => {
          lines.push(`- ${rec}`);
        });
        lines.push('');
      }
    });
  }

  // AI Insights
  if (data.aiInsights) {
    lines.push('---');
    lines.push('');
    lines.push('### Insight Neural');
    lines.push('');
    lines.push(data.aiInsights);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Relatório gerado automaticamente pelo Neural Unlocker AI - Método IP*');

  return lines.join('\n');
}

export function downloadMarkdown(data: ReportData): void {
  const content = generateMarkdownReport(data);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-desbloqueio-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF Export ──

export async function downloadPDF(data: ReportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addText = (text: string, size: number, style: string = 'normal', color: [number, number, number] = [255, 255, 255]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = size * 0.5;
    checkPage(lines.length * lineHeight);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 2;
  };

  // Background
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  // Title
  addText('RELATÓRIO DE DESBLOQUEIO NEURAL', 18, 'bold', [99, 102, 241]);
  y += 2;
  addText('Método IP - Neural Unlocker AI', 10, 'normal', [150, 150, 150]);
  y += 8;

  // Session info
  addText('INFORMAÇÕES DA SESSÃO', 11, 'bold', [99, 102, 241]);
  y += 2;
  addText(`Data: ${formatDate(data.sessionMetadata.createdAt)}`, 9, 'normal', [200, 200, 200]);
  addText(`Duração: ${formatDuration(data.sessionMetadata.durationSeconds)}`, 9, 'normal', [200, 200, 200]);
  addText(`Perguntas: ${data.sessionMetadata.questionsAnswered} de ${data.sessionMetadata.totalQuestions}`, 9, 'normal', [200, 200, 200]);
  y += 6;

  // Separator
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.3);
  checkPage(4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Question Responses
  if (data.questionResponses.length > 0) {
    addText('RESPOSTAS ÀS PERGUNTAS', 11, 'bold', [99, 102, 241]);
    y += 3;

    data.questionResponses.forEach((qr, i) => {
      const category = CATEGORY_LABELS[qr.category] || qr.category;
      checkPage(20);
      addText(`${i + 1}. [${category}] ${qr.questionText}`, 9, 'bold', [200, 200, 200]);
      addText(qr.userResponse, 9, 'italic', [160, 160, 160]);
      y += 4;
    });
    y += 4;
  }

  // Block Analysis
  if (data.blocks.length > 0) {
    doc.setDrawColor(99, 102, 241);
    checkPage(4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    addText('ANÁLISE DE BLOQUEIOS', 11, 'bold', [99, 102, 241]);
    y += 3;

    data.blocks.forEach((block, i) => {
      checkPage(30);

      addText(`BLOQUEIO #${i + 1}: ${block.blockName.toUpperCase()}`, 10, 'bold', [220, 220, 220]);
      addText(`Intensidade: ${block.intensity}%`, 9, 'bold', [
        block.intensity > 70 ? 239 : block.intensity > 40 ? 234 : 34,
        block.intensity > 70 ? 68 : block.intensity > 40 ? 179 : 197,
        block.intensity > 70 ? 68 : block.intensity > 40 ? 8 : 94
      ]);
      addText(block.description, 9, 'italic', [180, 180, 180]);
      y += 2;

      if (block.recommendations.length > 0) {
        addText('Recomendações:', 9, 'bold', [34, 211, 238]);
        block.recommendations.forEach(rec => {
          addText(`  • ${rec}`, 8, 'normal', [160, 160, 160]);
        });
      }
      y += 6;
    });
  }

  // AI Insights
  if (data.aiInsights) {
    doc.setDrawColor(99, 102, 241);
    checkPage(4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    addText('INSIGHT NEURAL', 11, 'bold', [99, 102, 241]);
    y += 3;
    addText(data.aiInsights, 9, 'italic', [200, 200, 200]);
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Re-fill background for new pages
    if (i > 1) {
      doc.setFillColor(5, 5, 5);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    }
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Neural Unlocker AI - Método IP | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorio-desbloqueio-${new Date().toISOString().slice(0, 10)}.pdf`);
}
