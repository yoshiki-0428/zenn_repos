// index.ts
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// Notion API のクライアントを初期化
const notion = new Client({ auth: process.env.PERSONAL_NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

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
  // 小文字に変換
  let slug = raw.toLowerCase();
  // 半角英数字、ハイフン、アンダースコア以外を除去
  slug = slug.replace(/[^a-z0-9-_]/g, '');
  // 12文字未満なら、末尾に 'a' を補って12文字にする
  if (slug.length < 12) {
    slug = slug.padEnd(12, 'a');
  }
  // 50文字以上なら切り詰める
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
  }
  return slug;
}

(async () => {
  try {
    // 例：Status プロパティが "publish" かつ、Public=true で、ZennTypeが設定されている記事を取得
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'Public',
            checkbox: { equals: true }
          },
          {
            property: 'ZennType',
            select: { is_not_empty: true }
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

      // notion-to-md でページ内容を Markdown に変換
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      const mdString = n2m.toMarkdownString(mdBlocks);

      // zenn type
      const zennType = page.properties.ZennType.select.name;

      // Zenn 用 Front Matter の生成（必要に応じて編集）
      const frontMatter = `---
title: ${title}
emoji: ${page.icon?.emoji ?? '📝'}
type: ${zennType}
topics: [${page.properties.Tags.multi_select.map((tag: any) => tag.name).join(', ')}]
published: true
---

`;
      // ※ mdString.parent ではなく mdString を利用する場合もあります。実際の出力内容に合わせて調整してください。
      const content = frontMatter + mdString.parent;

      // ファイルの出力
      const filePath = path.join(articlesDir, `${slug}.md`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`File created: ${filePath}`);
    }
  } catch (error) {
    console.error('Error occurred:', error);
    process.exit(1);
  }
})();
