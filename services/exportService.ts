import { ReportData } from '@/types/export';
import { CATEGORY_LABELS } from '@/constants/questions';
import { LEVEL_LABELS, INVESTIGATION_CATEGORY_LABELS, EMOTION_LABELS, BlockLevel, NeuralAnalysis, EvidenceItem } from '@/types/analysis';

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

function getLevelLabel(block: NeuralAnalysis): string {
  if (block.level) return `${block.level}/5 — ${LEVEL_LABELS[block.level as BlockLevel] || 'N/A'}`;
  if (block.intensity != null) return `${block.intensity}% (legado)`;
  return 'N/A';
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
    lines.push('### Mapeamento de Desbloqueios');
    lines.push('');
    data.blocks.forEach((block, i) => {
      lines.push(`#### Bloqueio #${i + 1}: ${block.blockName}`);
      lines.push('');
      lines.push(`- **Nível:** ${getLevelLabel(block)}`);
      if (block.investigationCategory) {
        lines.push(`- **Categoria:** ${INVESTIGATION_CATEGORY_LABELS[block.investigationCategory]}`);
      }
      lines.push(`- **Descrição:** ${block.description}`);
      lines.push('');

      if (block.evidence && block.evidence.length > 0) {
        lines.push('**Evidências:**');
        block.evidence.forEach((ev: EvidenceItem | string) => {
          if (typeof ev === 'string') {
            lines.push(`> "${ev}"`);
          } else {
            lines.push(`> "${ev.phrase}" — *${EMOTION_LABELS[ev.dominantEmotion] || ev.dominantEmotion}* (${ev.context})`);
          }
        });
        lines.push('');
      }

      if (block.currentPatterns && block.currentPatterns.length > 0) {
        lines.push('**Padrões Atuais:**');
        block.currentPatterns.forEach(p => {
          lines.push(`- ${p}`);
        });
        lines.push('');
      }

      if (block.actionPlan && block.actionPlan.length > 0) {
        lines.push('**Plano de Ação:**');
        block.actionPlan.forEach((step, j) => {
          lines.push(`${j + 1}. ${step}`);
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

const LEVEL_PDF_COLORS: Record<number, [number, number, number]> = {
  5: [239, 68, 68],   // red
  4: [249, 115, 22],  // orange
  3: [234, 179, 8],   // yellow
  2: [34, 197, 94],   // green
  1: [16, 185, 129],  // emerald
};

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

    addText('MAPEAMENTO DE DESBLOQUEIOS', 11, 'bold', [99, 102, 241]);
    y += 3;

    data.blocks.forEach((block, i) => {
      checkPage(40);

      const level = block.level ?? 3;
      const levelColor = LEVEL_PDF_COLORS[level] || LEVEL_PDF_COLORS[3];

      addText(`BLOQUEIO #${i + 1}: ${block.blockName.toUpperCase()}`, 10, 'bold', [220, 220, 220]);
      addText(`Nível: ${getLevelLabel(block)}`, 9, 'bold', levelColor);

      if (block.investigationCategory) {
        addText(`Categoria: ${INVESTIGATION_CATEGORY_LABELS[block.investigationCategory]}`, 8, 'normal', [150, 150, 200]);
      }

      addText(block.description, 9, 'italic', [180, 180, 180]);
      y += 2;

      if (block.evidence && block.evidence.length > 0) {
        addText('Evidências:', 9, 'bold', [245, 158, 11]);
        block.evidence.forEach((ev: EvidenceItem | string) => {
          if (typeof ev === 'string') {
            addText(`  "${ev}"`, 8, 'italic', [160, 160, 160]);
          } else {
            addText(`  "${ev.phrase}"`, 8, 'italic', [160, 160, 160]);
            addText(`    ${EMOTION_LABELS[ev.dominantEmotion] || ev.dominantEmotion} — ${ev.context}`, 7, 'normal', [130, 130, 130]);
          }
        });
        y += 2;
      }

      if (block.currentPatterns && block.currentPatterns.length > 0) {
        addText('Padrões Atuais:', 9, 'bold', [168, 85, 247]);
        block.currentPatterns.forEach(p => {
          addText(`  • ${p}`, 8, 'normal', [160, 160, 160]);
        });
        y += 2;
      }

      if (block.actionPlan && block.actionPlan.length > 0) {
        addText('Plano de Ação:', 9, 'bold', [34, 211, 238]);
        block.actionPlan.forEach((step, j) => {
          addText(`  ${j + 1}. ${step}`, 8, 'normal', [160, 160, 160]);
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
