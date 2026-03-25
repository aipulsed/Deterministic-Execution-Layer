/**
 * @file sqlFormatter.ts
 * @description SQL formatter with configurable dialect support
 */

export type SqlDialect = "sql" | "mysql" | "postgresql" | "sqlite";
export function formatSql(sql: string, dialect: SqlDialect = "sql"): string {
  let formatted = sql.trim();
  const keywords = ["SELECT","FROM","WHERE","JOIN","LEFT JOIN","RIGHT JOIN","INNER JOIN","ORDER BY","GROUP BY","HAVING","INSERT INTO","UPDATE","DELETE FROM","CREATE TABLE","DROP TABLE","ALTER TABLE","ON","AND","OR","NOT","IN","IS","NULL","AS","DISTINCT","LIMIT","OFFSET","SET","VALUES","UNION","WITH"];
  for (const kw of keywords) {
    formatted = formatted.replace(new RegExp("\\b" + kw + "\\b", "gi"), "\n" + kw);
  }
  return formatted.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
}
export default { formatSql };
