import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), 'app/wiki/docs');

export async function getDocs() {
  const fileNames = fs.readdirSync(docsDirectory);
  const allDocsData = fileNames.map(fileName => {
    const slug = fileName.replace(/\.mdx?$/, '');
    const fullPath = path.join(docsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);
      
    if (slug === 'index') {
        return {
            slug : "",
            ...(data as { title?: string; order?: number }),
        };
    }

    return {
      slug,
      ...(data as { title?: string; order?: number }),
    };
  });

  return allDocsData.sort((a, b) => (a.order || 999) - (b.order || 999));
}
