/**
 * @file emailTemplates.ts
 * @description Email template renderer for the DEL, supporting variable substitution
 *              and HTML/text dual-format email generation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger/logger';

/** Template variables map */
export type TemplateVariables = Record<string, string | number | boolean | undefined>;

/** Rendered email content */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Template definition */
export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

const templateCache = new Map<string, EmailTemplate>();

/**
 * Registers an email template.
 * @param template - Template definition
 */
export function registerTemplate(template: EmailTemplate): void {
  templateCache.set(template.name, template);
  logger.debug(`Email template registered: ${template.name}`);
}

/**
 * Loads and registers templates from a directory.
 * @param templateDir - Directory containing .html template files
 */
export function loadTemplatesFromDirectory(templateDir: string): void {
  if (!fs.existsSync(templateDir)) return;

  const files = fs.readdirSync(templateDir).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    const name = path.basename(file, '.html');
    const html = fs.readFileSync(path.join(templateDir, file), 'utf-8');
    registerTemplate({ name, subject: name, html });
  }
}

/**
 * Renders a template with variables substituted.
 * @param templateName - Template identifier
 * @param variables - Variables to substitute
 * @returns Rendered email content
 */
export function renderTemplate(templateName: string, variables: TemplateVariables = {}): RenderedEmail {
  const template = templateCache.get(templateName);
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const rendered: RenderedEmail = {
    subject: substituteVariables(template.subject, variables),
    html: substituteVariables(template.html, variables),
    text: template.text ? substituteVariables(template.text, variables) : htmlToPlainText(template.html),
  };

  return rendered;
}

/**
 * Substitutes {{variable}} placeholders in a string.
 * @param template - Template string
 * @param variables - Variables map
 * @returns Rendered string
 */
export function substituteVariables(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Converts HTML to plain text by stripping tags.
 * @param html - HTML string
 * @returns Plain text
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Register built-in templates
registerTemplate({
  name: 'welcome',
  subject: 'Welcome to {{appName}}, {{name}}!',
  html: `<h1>Welcome, {{name}}!</h1><p>Thank you for joining {{appName}}.</p>`,
});

registerTemplate({
  name: 'password-reset',
  subject: 'Password Reset Request',
  html: `<h1>Password Reset</h1><p>Click <a href="{{resetUrl}}">here</a> to reset your password. This link expires in {{expiresIn}}.</p>`,
});

export default { registerTemplate, loadTemplatesFromDirectory, renderTemplate, substituteVariables };
