import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-resume-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resume-upload.component.html',
  styleUrls: ['./resume-upload.css']
})
export class ResumeUploadComponent {
  resumeText = '';
  response: any;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

selectedFile!: File;

onFileSelect(event: any) {
  this.selectedFile = event.target.files[0];
}

loading = false;

uploadFile() {
  if (!this.selectedFile) return;

  const formData = new FormData();
  formData.append('file', this.selectedFile);

  this.loading = true; // start loading

  this.http.post('https://resume-backend-p322.onrender.com/resume/upload', formData)
    .subscribe({
      next: (res: any) => {
        console.log(res); // debug
        this.response = res;
        this.loading = false; // ✅ STOP loading
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false; // ✅ STOP even on error
        this.cdr.detectChanges();
      }
    });
}

extractScore(text: string): string {
  const match = text.match(/\d{1,3}\/100/);
  return match ? match[0] : 'N/A';
}

downloadPDF() {
  if (!this.response) return;

  const doc = new jsPDF();

  const text = this.response.result || '';

  // 📄 Page setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 10;
  const maxWidth = pageWidth - margin * 2;

  let y = 20;

  // 🏷️ Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AI Resume Analysis Report', margin, 10);

  // 🔢 Extract Score (if exists)
  const scoreMatch = text.match(/\d{1,3}\/100/);
  const score = scoreMatch ? scoreMatch[0] : 'N/A';

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Score: ${score}`, margin, y);
  y += 10;

  // 📄 Content
  doc.setFontSize(11);

  const sections = text.split('\n');

  sections.forEach((line: string) => {
    let formattedLine = line.trim();

    if (!formattedLine) {
      y += 5;
      return;
    }

    // 🔥 Bold headings
    if (
      formattedLine.toLowerCase().includes('strength') ||
      formattedLine.toLowerCase().includes('weakness') ||
      formattedLine.toLowerCase().includes('suggestion')
    ) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    // 👉 Replace "-" with bullet
    if (formattedLine.startsWith('-')) {
      formattedLine = '• ' + formattedLine.substring(1).trim();
    }

    // 🧠 Wrap text
    const wrappedLines = doc.splitTextToSize(formattedLine, maxWidth);

    // 🚨 Page break handling
    if (y + wrappedLines.length * 7 > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }

    doc.text(wrappedLines, margin, y);

    y += wrappedLines.length * 7 + 2; // spacing
  });

  // 💾 Save PDF
  doc.save('AI-Resume-Analysis.pdf');
}


}