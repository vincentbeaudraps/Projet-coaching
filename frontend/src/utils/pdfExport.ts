// filepath: frontend/src/utils/pdfExport.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * PDF Export Utility
 * Generate professional PDF reports for athletes
 */

interface Session {
  id: string;
  title: string;
  type?: string;
  distance?: number;
  duration: number;
  intensity?: string;
  startDate: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  avgPace?: string;
  date: string;
  notes?: string;
}

interface AthleteProfile {
  name: string;
  email: string;
  age?: number;
  vma?: number;
  fcMax?: number;
  weight?: number;
  height?: number;
}

interface WeeklyStats {
  totalDistance: number;
  totalDuration: number;
  sessionsCompleted: number;
  averagePace: string;
  weekNumber: number;
  dateRange: string;
}

/**
 * Export weekly report
 */
export function exportWeeklyReport(
  athlete: AthleteProfile,
  sessions: Session[],
  activities: Activity[],
  stats: WeeklyStats
): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(99, 102, 241); // Indigo
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Bilan Hebdomadaire', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Semaine ${stats.weekNumber} - ${stats.dateRange}`, 105, 30, { align: 'center' });
  
  // Athlete info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Athlète : ${athlete.name}`, 20, 50);
  
  // Statistics boxes
  let yPos = 65;
  
  const statsData = [
    { label: 'Distance totale', value: `${stats.totalDistance.toFixed(1)} km`, color: [99, 102, 241] },
    { label: 'Temps total', value: `${Math.round(stats.totalDuration / 60)}h ${stats.totalDuration % 60}min`, color: [16, 185, 129] },
    { label: 'Séances réalisées', value: `${stats.sessionsCompleted}`, color: [245, 158, 11] },
    { label: 'Allure moyenne', value: stats.averagePace, color: [239, 68, 68] },
  ];
  
  statsData.forEach((stat, index) => {
    const xPos = 20 + (index % 2) * 95;
    const y = yPos + Math.floor(index / 2) * 35;
    
    // Box
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(xPos, y, 85, 25, 3, 3, 'F');
    
    // Value
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, xPos + 42.5, y + 12, { align: 'center' });
    
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xPos + 42.5, y + 20, { align: 'center' });
  });
  
  yPos = 140;
  
  // Activities table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('🏃 Activités de la semaine', 20, yPos);
  
  yPos += 5;
  
  if (activities.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Distance', 'Durée', 'Allure']],
      body: activities.map(a => [
        new Date(a.date).toLocaleDateString('fr-FR'),
        a.type || 'Course',
        `${a.distance.toFixed(1)} km`,
        `${Math.floor(a.duration / 60)}:${String(a.duration % 60).padStart(2, '0')}`,
        a.avgPace || '-'
      ]),
      headStyles: {
        fillColor: [99, 102, 241],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 20, right: 20 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Aucune activité enregistrée cette semaine', 20, yPos + 10);
    yPos += 20;
  }
  
  // Planned sessions table
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 Séances planifiées', 20, yPos);
  
  yPos += 5;
  
  if (sessions.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Titre', 'Type', 'Durée', 'Intensité']],
      body: sessions.map(s => [
        new Date(s.startDate).toLocaleDateString('fr-FR'),
        s.title,
        s.type || '-',
        `${s.duration} min`,
        s.intensity || '-'
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 20, right: 20 },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Aucune séance planifiée', 20, yPos + 10);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `VB Coaching - Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `rapport_semaine_${stats.weekNumber}_${athlete.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Export athlete profile
 */
export function exportAthleteProfile(
  athlete: AthleteProfile,
  _sessions: Session[], // Kept for future use
  activities: Activity[],
  totalStats: {
    totalDistance: number;
    totalDuration: number;
    totalSessions: number;
    averagePace: string;
  }
): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(139, 92, 246); // Purple
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('👤 Fiche Athlète', 105, 25, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(athlete.name, 105, 38, { align: 'center' });
  
  // Profile section
  let yPos = 65;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 Informations personnelles', 20, yPos);
  
  yPos += 10;
  
  const profileData = [
    ['Email', athlete.email],
    ['Âge', athlete.age ? `${athlete.age} ans` : '-'],
    ['VMA', athlete.vma ? `${athlete.vma} km/h` : '-'],
    ['FC Max', athlete.fcMax ? `${athlete.fcMax} bpm` : '-'],
    ['Poids', athlete.weight ? `${athlete.weight} kg` : '-'],
    ['Taille', athlete.height ? `${athlete.height} cm` : '-'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: profileData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 130 },
    },
    margin: { left: 20 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Statistiques globales', 20, yPos);
  
  yPos += 5;
  
  const statsBoxes = [
    { label: 'Distance totale', value: `${totalStats.totalDistance.toFixed(1)} km`, color: [99, 102, 241] },
    { label: 'Temps total', value: `${Math.round(totalStats.totalDuration / 60)}h`, color: [16, 185, 129] },
    { label: 'Séances', value: `${totalStats.totalSessions}`, color: [245, 158, 11] },
    { label: 'Allure moy.', value: totalStats.averagePace, color: [239, 68, 68] },
  ];
  
  statsBoxes.forEach((stat, index) => {
    const xPos = 20 + (index % 2) * 95;
    const y = yPos + 5 + Math.floor(index / 2) * 35;
    
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(xPos, y, 85, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, xPos + 42.5, y + 12, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xPos + 42.5, y + 20, { align: 'center' });
  });
  
  yPos += 80;
  
  // Recent activities
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('🏃 Activités récentes', 20, yPos);
  
  yPos += 5;
  
  const recentActivities = activities.slice(0, 10);
  
  if (recentActivities.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Distance', 'Durée', 'Allure']],
      body: recentActivities.map(a => [
        new Date(a.date).toLocaleDateString('fr-FR'),
        a.type || 'Course',
        `${a.distance.toFixed(1)} km`,
        `${Math.floor(a.duration / 60)}:${String(a.duration % 60).padStart(2, '0')}`,
        a.avgPace || '-'
      ]),
      headStyles: {
        fillColor: [139, 92, 246],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 20, right: 20 },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `VB Coaching - Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }
  
  const filename = `fiche_athlete_${athlete.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Export training plan
 */
export function exportTrainingPlan(
  athlete: AthleteProfile,
  sessions: Session[],
  startDate: Date | string,
  endDate: Date | string,
  goalDescription?: string
): void {
  const doc = new jsPDF();
  
  // Convert strings to Date if necessary
  const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Header
  doc.setFillColor(16, 185, 129); // Green
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 Plan d\'Entraînement', 105, 22, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(athlete.name, 105, 32, { align: 'center' });
  doc.text(
    `${startDateObj.toLocaleDateString('fr-FR')} → ${endDateObj.toLocaleDateString('fr-FR')}`,
    105,
    40,
    { align: 'center' }
  );
  
  let yPos = 65;
  
  // Goal
  if (goalDescription) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🎯 Objectif :', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(goalDescription, 20, yPos + 8);
    yPos += 20;
  }
  
  // Sessions table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 Programme des séances', 20, yPos);
  
  yPos += 5;
  
  if (sessions.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Titre', 'Type', 'Durée', 'Intensité', 'Notes']],
      body: sessions.map(s => [
        new Date(s.startDate).toLocaleDateString('fr-FR'),
        s.title,
        s.type || '-',
        `${s.duration} min`,
        s.intensity || '-',
        (s.notes || '').substring(0, 30) + ((s.notes || '').length > 30 ? '...' : '')
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 40 },
      },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `VB Coaching - Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }
  
  const filename = `plan_entrainement_${athlete.name.replace(/\s+/g, '_')}_${startDateObj.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
