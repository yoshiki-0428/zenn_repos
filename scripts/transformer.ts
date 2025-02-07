import { NotionToMarkdown } from 'notion-to-md';
import type {
  BookmarkBlockObjectResponse,
  CodeBlockObjectResponse, EmbedBlockObjectResponse, EquationBlockObjectResponse,
  ImageBlockObjectResponse, LinkPreviewBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {Client} from "@notionhq/client";
import {uploadImage} from "./utis.ts";

// Notion API のクライアントを初期化
const notion = new Client({ auth: process.env.PERSONAL_NOTION_TOKEN });
export const n2m = new NotionToMarkdown({ notionClient: notion });

// embed
// https://zenn.dev/zenn/articles/markdown-guide#%E3%82%B3%E3%83%B3%E3%83%86%E3%83%B3%E3%83%84%E3%81%AE%E5%9F%8B%E3%82%81%E8%BE%BC%E3%81%BF
n2m.setCustomTransformer('embed', (block) => {
  const { embed } = block as EmbedBlockObjectResponse;
  if (!embed.url) return '';

  return `
${embed.url}
`;
});

// equation
// https://zenn.dev/zenn/articles/markdown-guide#%E6%95%B0%E5%BC%8F
n2m.setCustomTransformer('equation', (block) => {
  const { equation } = block as EquationBlockObjectResponse;

  return `$$
${equation.expression}
$$`;
});

// bookmark
// https://zenn.dev/zenn/articles/markdown-guide#%E3%83%AA%E3%83%B3%E3%82%AF%E3%82%AB%E3%83%BC%E3%83%89
n2m.setCustomTransformer('bookmark', (block) => {
  const { bookmark } = block as BookmarkBlockObjectResponse;
  if (!bookmark.url) return '';

  return `
@[card](${bookmark.url})
`;
});

n2m.setCustomTransformer('link_preview', (block) => {
  const { link_preview } = block as LinkPreviewBlockObjectResponse;
  if (!link_preview.url) return '';

  return `
@[card](${link_preview.url})
`;
});

n2m.setCustomTransformer('image', async (block) => {
  const { image, parent } = block as ImageBlockObjectResponse;
  // type externalならupload処理をしない
  if (image.type === 'external') {
    return `![${image.caption[0]?.plain_text || image.external.url}](${image.external.url})`;
  }

  const imageUrl = image.file.url

  return `![notion-image:${image.caption[0]?.plain_text || imageUrl}](${imageUrl})`;
  // Markdown 内で参照する画像の URL を外部サーバのものに置き換え
  // return `![${image.caption[0]?.plain_text || cloudinaryImageUrl}](${cloudinaryImageUrl})`;
});

// code
// https://zenn.dev/zenn/articles/markdown-guide#%E3%82%B3%E3%83%BC%E3%83%89%E3%83%96%E3%83%AD%E3%83%83%E3%82%AF
n2m.setCustomTransformer('code', (block) => {
  const { code } = block as CodeBlockObjectResponse;
  const language = code.language === 'plain text' ? 'text' : code.language;
  const fileName = code.caption.map((item) => item.plain_text).join('');
  const codeString = code.rich_text.map((item) => item.plain_text).join('');

  if (language === 'diff') {
    return `\`\`\`${language} ${fileName || 'text'}
${codeString}
\`\`\``;
  }

  if (language === 'text' && fileName) {
    return `\`\`\`${fileName}
${codeString}
\`\`\``;
  }

  return `\`\`\`${language}${fileName ? `:${fileName}` : ''}
${codeString}
\`\`\``;
});