#!/usr/bin/env node

/**
 * 🔍 Analyse les fichiers pour détecter les patterns à optimiser
 * Usage: node analyze-patterns.js [directory]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATTERNS = {
  backend: {
    tryCatch: /try\s*{[\s\S]*?}\s*catch\s*\(/g,
    notFoundCheck: /if\s*\(\s*\w+\.rows\.length\s*===\s*0\s*\)/g,
    status404: /res\.status\(404\)/g,
    status500: /res\.status\(500\)/g,
    consoleError: /console\.error\(/g,
    athleteQuery: /SELECT.*FROM athletes WHERE/gi,
    verifyOwnership: /SELECT.*coach_id.*FROM athletes/gi,
  },
  frontend: {
    useState: /useState\(/g,
    useEffect: /useEffect\(/g,
    setLoading: /setLoading\(/g,
    setError: /setError\(/g,
    tryCatch: /try\s*{[\s\S]*?}\s*catch\s*\(/g,
    asyncFetch: /const\s+\w+\s*=\s*async\s*\(\s*\)\s*=>\s*{[\s\S]*?try/g,
  }
};

function analyzeFile(filePath, type) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = {
    filePath,
    lineCount: content.split('\n').length,
    matches: {}
  };

  const patterns = PATTERNS[type];
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern);
    stats.matches[name] = matches ? matches.length : 0;
  }

  return stats;
}

function scanDirectory(dir, type, results = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        scanDirectory(fullPath, type, results);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!file.endsWith('.d.ts')) {
        results.push(analyzeFile(fullPath, type));
      }
    }
  }

  return results;
}

function calculateOptimizationPotential(stats, type) {
  if (type === 'backend') {
    // Chaque try-catch = ~8 lignes économisées avec asyncHandler
    // Chaque vérification = ~5 lignes économisées avec service
    return (
      stats.matches.tryCatch * 8 +
      stats.matches.notFoundCheck * 3 +
      stats.matches.athleteQuery * 2
    );
  } else {
    // Frontend: useState + useEffect pattern = ~15 lignes économisées
    const apiCallPatterns = Math.min(stats.matches.useState, stats.matches.useEffect);
    return apiCallPatterns * 12;
  }
}

function generateReport(results, type) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Analyse ${type.toUpperCase()} - Patterns d'optimisation`);
  console.log('='.repeat(60));

  let totalLines = 0;
  let totalOptimization = 0;
  const fileStats = [];

  for (const stat of results) {
    totalLines += stat.lineCount;
    const potential = calculateOptimizationPotential(stat, type);
    totalOptimization += potential;

    if (potential > 20) {
      fileStats.push({
        path: path.relative(process.cwd(), stat.filePath),
        lines: stat.lineCount,
        potential,
        matches: stat.matches
      });
    }
  }

  // Trier par potentiel d'optimisation
  fileStats.sort((a, b) => b.potential - a.potential);

  console.log(`\n📈 Statistiques globales:`);
  console.log(`   Fichiers analysés: ${results.length}`);
  console.log(`   Lignes totales: ${totalLines.toLocaleString()}`);
  console.log(`   Optimisation potentielle: ~${totalOptimization} lignes (-${Math.round(totalOptimization / totalLines * 100)}%)\n`);

  console.log(`\n🎯 Top 10 fichiers à optimiser:\n`);
  fileStats.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.path}`);
    console.log(`   📏 ${file.lines} lignes | 💡 ~${file.potential} lignes à économiser`);
    
    if (type === 'backend') {
      console.log(`   Patterns: try-catch(${file.matches.tryCatch}) | 404(${file.matches.status404}) | 500(${file.matches.status500})`);
    } else {
      console.log(`   Patterns: useState(${file.matches.useState}) | useEffect(${file.matches.useEffect}) | try-catch(${file.matches.tryCatch})`);
    }
    console.log('');
  });

  console.log(`\n💡 Recommandations:`);
  if (type === 'backend') {
    console.log(`   1. Appliquer asyncHandler aux ${results.reduce((sum, s) => sum + s.matches.tryCatch, 0)} routes avec try-catch`);
    console.log(`   2. Utiliser athleteService pour les ${results.reduce((sum, s) => sum + s.matches.verifyOwnership, 0)} vérifications d'ownership`);
    console.log(`   3. Remplacer les ${results.reduce((sum, s) => sum + s.matches.status404, 0)} status 404 par NotFoundError`);
  } else {
    console.log(`   1. Migrer ${Math.min(...results.map(s => Math.min(s.matches.useState, s.matches.useEffect)))} patterns vers useApi`);
    console.log(`   2. Simplifier ${results.reduce((sum, s) => sum + s.matches.tryCatch, 0)} gestions d'erreurs`);
    console.log(`   3. Utiliser useApiSubmit pour les soumissions de formulaires`);
  }
}

// Main
const args = process.argv.slice(2);
const targetDir = args[0] || '.';

console.log(`🔍 Analyse du répertoire: ${targetDir}\n`);

const backendDir = path.join(targetDir, 'backend/src');
const frontendDir = path.join(targetDir, 'frontend/src');

if (fs.existsSync(backendDir)) {
  const backendResults = scanDirectory(backendDir, 'backend');
  generateReport(backendResults, 'backend');
}

if (fs.existsSync(frontendDir)) {
  const frontendResults = scanDirectory(frontendDir, 'frontend');
  generateReport(frontendResults, 'frontend');
}

console.log(`\n${'='.repeat(60)}\n`);
