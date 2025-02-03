// scripts/index.ts
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import {Client} from '@notionhq/client';
import {NotionToMarkdown} from 'notion-to-md';

// Notion API のクライアントを初期化
const notion = new Client({auth: process.env.PERSONAL_NOTION_TOKEN});
const n2m = new NotionToMarkdown({notionClient: notion});

// 環境変数から Notion データベース ID を取得
const databaseId = process.env.PERSONAL_NOTION_DATABASE_ID;
if (!databaseId) {
  console.error('Error: PERSONAL_NOTION_DATABASE_ID is not defined.');
  process.exit(1);
}

/**
 * slugをクリーンにする関数
 *  - 入力文字列を小文字に変換
 *  - 許可されている文字 [a-z0-9\-_] 以外を除去
 *  - 長さが12未満の場合は末尾に'a'を補填（12文字になるまで）
 *  - 長さが50文字を超える場合は50文字に切り詰める
 */
function cleanSlug(raw: string): string {
  let slug = raw.toLowerCase();
  slug = slug.replace(/[^a-z0-9-_]/g, '');
  if (slug.length < 12) {
    slug = slug.padEnd(12, 'a');
  }
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
  }
  return slug;
}

(async () => {
  try {
    // 例：Publicがtrueかつ、ZennTypeが設定されている記事を取得
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'Public',
            checkbox: {equals: true}
          },
          {
            property: 'ZennType',
            select: {is_not_empty: true}
          },
        ]
      },
    });
    const pages = response.results as any[];

    console.log('published articles:', pages.length);

    // 出力先ディレクトリ（articles/）を作成
    const articlesDir = path.join('articles');
    if (!fs.existsSync(articlesDir)) {
      fs.mkdirSync(articlesDir);
    }

    // Notionから生成されたslugの一覧を保持する配列
    const generatedSlugs = new Set<string>();

    for (const page of pages) {
      const pageId: string = page.id;

      // タイトル取得
      const title: string = page.properties.Name.title[0].plain_text;

      // ファイル名用の Raw Slug（なければ pageId をベースにする）
      const slugProp = page.properties.Slug;
      const rawSlug: string =
          (slugProp && slugProp.rich_text?.[0]?.plain_text.replace(/\s+/g, '-')) ||
          pageId.replace(/-/g, '');
      // ルールに則ってslugをクリーンにする
      const slug = cleanSlug(rawSlug);
      generatedSlugs.add(slug);

      // notion-to-md でページ内容を Markdown に変換
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      const mdString = n2m.toMarkdownString(mdBlocks);

      // zenn type の取得
      const zennType = page.properties.ZennType.select.name;

      // Zenn 用 Front Matter の生成
      const frontMatter = `---
title: ${title}
emoji: ${page.icon?.emoji ?? '📝'}
type: ${zennType}
topics: [${page.properties.Tags.multi_select.map((tag: any) => tag.name).join(', ')}]
published: true
---

`;
      // ※ mdString.parent を使用しているのは、notion-to-md の出力構造に合わせています。
      const content = frontMatter + mdString.parent;

      // ファイルの出力
      const filePath = path.join(articlesDir, `${slug}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`File created: ${filePath}`);
    }

    // 既存のarticlesディレクトリ内の.mdファイルを走査し、
    // 生成されたslugに含まれていないファイルを削除する
    const files = fs.readdirSync(articlesDir);
    for (const file of files) {
      if (path.extname(file) === '.md') {
        const baseName = path.basename(file, '.md');
        if (!generatedSlugs.has(baseName)) {
          const filePath = path.join(articlesDir, file);
          fs.unlinkSync(filePath);
          console.log(`Deleted obsolete file: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error occurred:', error);
    process.exit(1);
  }
})();
