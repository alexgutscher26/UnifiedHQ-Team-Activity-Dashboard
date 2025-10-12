#!/usr/bin/env node

/**
 * Code Review Tools
 * Automated tools for code review analysis and reporting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReviewTools {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      issues: [],
      warnings: [],
      suggestions: [],
      metrics: {},
    };
  }

  /**
   * Analyze code quality issues
   */
  async analyzeCodeQuality() {
    console.log('🔍 Analyzing code quality...');

    // Check for console.log statements
    this.checkConsoleLogs();

    // Check for TODO comments
    this.checkTODOComments();

    // Check for hardcoded values
    this.checkHardcodedValues();

    // Check for unused imports
    this.checkUnusedImports();

    // Check for security issues
    this.checkSecurityIssues();

    // Check project-specific rules
    this.checkProjectRules();
  }

  /**
   * Check for console.log statements
   */
  checkConsoleLogs() {
    try {
      const result = execSync(
        'grep -r "console\\.log" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line && !line.includes('// eslint-disable')) {
            this.results.issues.push({
              type: 'console.log',
              message: 'Console.log statement found',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'error',
            });
          }
        });
      }
    } catch (error) {
      // No console.log statements found
    }
  }

  /**
   * Check for TODO comments.
   *
   * This function searches through the source files for any lines containing TODO, FIXME, or HACK comments.
   * It utilizes the execSync method to run a grep command on the specified file types. If any such comments are found,
   * it processes each line to extract the file name and line number, and pushes a warning object into the results.warnings array.
   */
  checkTODOComments() {
    try {
      const result = execSync(
        'grep -r "TODO\\|FIXME\\|HACK" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line) {
            this.results.warnings.push({
              type: 'todo',
              message: 'TODO/FIXME comment found',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'warning',
            });
          }
        });
      }
    } catch (error) {
    }
  }

  /**
   * Check for hardcoded values
   */
  checkHardcodedValues() {
    try {
      const result = execSync(
        'grep -r "localhost\\|127\\.0\\.0\\.1\\|password\\|secret" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line && !line.includes('// eslint-disable')) {
            this.results.warnings.push({
              type: 'hardcoded',
              message: 'Potential hardcoded value found',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'warning',
            });
          }
        });
      }
    } catch (error) {
      // No hardcoded values found
    }
  }

  /**
   * Check for unused imports
   */
  checkUnusedImports() {
    try {
      const result = execSync(
        'npx eslint --no-eslintrc --config .eslintrc.json --rule "no-unused-vars: error" --format compact src/ 2>/dev/null || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line.includes('no-unused-vars')) {
            this.results.warnings.push({
              type: 'unused-import',
              message: 'Unused import or variable',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'warning',
            });
          }
        });
      }
    } catch (error) {
      // No unused imports found
    }
  }

  /**
   * Check for security issues
   */
  checkSecurityIssues() {
    try {
      const result = execSync(
        'grep -r "eval\\|innerHTML\\|dangerouslySetInnerHTML" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line) {
            this.results.issues.push({
              type: 'security',
              message: 'Potential security issue found',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'error',
            });
          }
        });
      }
    } catch (error) {
      // No security issues found
    }
  }

  /**
   * Check project-specific rules
   */
  checkProjectRules() {
    // Check GitHub integration usage
    try {
      const result = execSync(
        'grep -r "@/lib/integrations/github[^-]" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line) {
            this.results.issues.push({
              type: 'github-integration',
              message:
                'Non-cached GitHub import found. Use @/lib/integrations/github-cached instead',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'error',
            });
          }
        });
      }
    } catch (error) {
      // No issues found
    }

    // Check image optimization usage
    try {
      const result = execSync(
        'grep -r "<img" src/ --include="*.tsx" --include="*.jsx" || true',
        { encoding: 'utf8' }
      );
      if (result.trim()) {
        const lines = result.trim().split('\n');
        lines.forEach(line => {
          if (line) {
            this.results.suggestions.push({
              type: 'image-optimization',
              message:
                'Consider using OptimizedImage component instead of standard img tag',
              file: line.split(':')[0],
              line: line.split(':')[1],
              severity: 'suggestion',
            });
          }
        });
      }
    } catch (error) {
      // No issues found
    }
  }

  /**
   * Calculate code metrics
   */
  calculateMetrics() {
    console.log('📊 Calculating code metrics...');

    try {
      // Get file count
      const fileCount = execSync(
        'find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l',
        { encoding: 'utf8' }
      ).trim();

      // Get line count
      const lineCount = execSync(
        'find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1',
        { encoding: 'utf8' }
      ).trim();

      // Get function count
      const functionCount = execSync(
        'grep -r "function\\|const.*=.*=>" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l',
        { encoding: 'utf8' }
      ).trim();

      this.results.metrics = {
        files: parseInt(fileCount),
        lines: parseInt(lineCount.split(' ')[0]),
        functions: parseInt(functionCount),
      };
    } catch (error) {
      console.error('Error calculating metrics:', error.message);
    }
  }

  /**
   * Generate review report
   */
  generateReport() {
    console.log('📝 Generating review report...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.results.issues.length,
        totalWarnings: this.results.warnings.length,
        totalSuggestions: this.results.suggestions.length,
        metrics: this.results.metrics,
      },
      issues: this.results.issues,
      warnings: this.results.warnings,
      suggestions: this.results.suggestions,
    };

    // Save report to file
    const reportPath = path.join(this.projectRoot, 'review-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(this.projectRoot, 'review-report.md');
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`📄 Markdown report saved to: ${markdownPath}`);

    return report;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    let markdown = `# 🔍 Code Review Report\n\n`;
    markdown += `**Generated:** ${report.timestamp}\n\n`;

    markdown += `## 📊 Summary\n\n`;
    markdown += `- **Issues:** ${report.summary.totalIssues}\n`;
    markdown += `- **Warnings:** ${report.summary.totalWarnings}\n`;
    markdown += `- **Suggestions:** ${report.summary.totalSuggestions}\n\n`;

    markdown += `## 📈 Metrics\n\n`;
    markdown += `- **Files:** ${report.summary.metrics.files}\n`;
    markdown += `- **Lines:** ${report.summary.metrics.lines}\n`;
    markdown += `- **Functions:** ${report.summary.metrics.functions}\n\n`;

    if (report.issues.length > 0) {
      markdown += `## ❌ Issues\n\n`;
      report.issues.forEach(issue => {
        markdown += `- **${issue.type}** in \`${issue.file}:${issue.line}\`\n`;
        markdown += `  - ${issue.message}\n\n`;
      });
    }

    if (report.warnings.length > 0) {
      markdown += `## ⚠️ Warnings\n\n`;
      report.warnings.forEach(warning => {
        markdown += `- **${warning.type}** in \`${warning.file}:${warning.line}\`\n`;
        markdown += `  - ${warning.message}\n\n`;
      });
    }

    if (report.suggestions.length > 0) {
      markdown += `## 💡 Suggestions\n\n`;
      report.suggestions.forEach(suggestion => {
        markdown += `- **${suggestion.type}** in \`${suggestion.file}:${suggestion.line}\`\n`;
        markdown += `  - ${suggestion.message}\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Run all analysis
   */
  async run() {
    console.log('🚀 Starting code review analysis...');

    await this.analyzeCodeQuality();
    this.calculateMetrics();
    const report = this.generateReport();

    console.log('✅ Analysis complete!');
    console.log(
      `📊 Found ${report.summary.totalIssues} issues, ${report.summary.totalWarnings} warnings, ${report.summary.totalSuggestions} suggestions`
    );

    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const reviewTools = new ReviewTools();
  reviewTools.run().catch(console.error);
}

module.exports = ReviewTools;
