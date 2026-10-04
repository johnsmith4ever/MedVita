import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

import * as ws from 'ws';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: {
    transport: ws.default || ws
  }
});

async function main() {
  console.log('Downloading MedlinePlus XML...');
  const xmlUrl = 'https://medlineplus.gov/xml/mplus_topics_2026-09-26.xml';
  const response = await fetch(xmlUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download XML: ${response.statusText}`);
  }

  const xmlData = await response.text();
  console.log(`Downloaded ${xmlData.length} bytes of XML. Parsing...`);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name, jpath, isLeafNode, isAttribute) => { 
      return ['health-topic', 'also-called.term', 'group'].includes(name);
    }
  });

  const parsed = parser.parse(xmlData);
  const topics = parsed['health-topics']['health-topic'];
  
  console.log(`Parsed ${topics.length} topics. Filtering...`);

  const conditionGroups = [
    'Disorders and Conditions',
    'Symptoms',
    'Injuries and Wounds',
    'Cancers',
    'Infections',
    'Genetic Conditions',
    'Immune System and Disorders',
    'Heart and Blood Vessel Diseases',
    'Brain and Nerves'
  ];

  const skipKeywords = ['Medications', 'Medicines', 'Drugs', 'Dietary Supplements', 'Surgery'];

  let insertedCount = 0;
  
  for (const topic of topics) {
    const title = topic['@_title'] || '';
    const groups = topic.group || [];
    const groupNames = groups.map((g: any) => g['#text'] || g).join(' ');
    
    // Simple filter: must have a related group and not be a medication/surgery
    const isCondition = conditionGroups.some(cg => groupNames.includes(cg));
    const isExcluded = skipKeywords.some(sk => title.includes(sk));
    
    if (isCondition && !isExcluded && title) {
      const summaryNode = topic['full-summary'];
      let summary = '';
      if (typeof summaryNode === 'string') {
        summary = summaryNode;
      } else if (summaryNode && summaryNode['#text']) {
        summary = summaryNode['#text'];
      } else if (summaryNode && typeof summaryNode === 'object') {
        // fast-xml-parser might parse inner HTML as objects if not configured properly, but usually it keeps it if we don't have mixed content parsing on.
        // Actually, to get raw string we might just need to stringify or we can just grab what we can.
        summary = JSON.stringify(summaryNode).substring(0, 1000); // fallback
      }
      
      // Clean up HTML tags from summary if it's a string
      if (typeof summary === 'string') {
        summary = summary.replace(/<[^>]*>?/gm, '').trim();
      }

      const url = topic['@_url'];
      const alsoCalled = topic['also-called']?.term || [];
      const synonyms = alsoCalled.map((t: any) => (typeof t === 'string' ? t : t['#text'])).filter(Boolean).join(', ');

      if (summary && summary.length > 10) {
        // Insert into Supabase
        const { error } = await supabase.from('conditions').upsert({
          condition_name: title,
          synonyms: synonyms,
          summary: summary,
          source_url: url
        }, { onConflict: 'condition_name' });

        if (error) {
          console.error(`Failed to insert ${title}:`, error.message);
        } else {
          insertedCount++;
          if (insertedCount === 1) {
            console.log('Sample matched:', title, '\nSummary:', summary, '\nURL:', url);
          }
          if (insertedCount % 50 === 0) {
            console.log(`Inserted ${insertedCount} conditions...`);
          }
        }
      } else {
        if (insertedCount === 0) {
           console.log(`Skipped ${title} due to missing summary. SummaryNode:`, summaryNode);
        }
      }
    }
  }

  console.log(`Done! Successfully inserted ${insertedCount} conditions into Supabase.`);
}

main().catch(console.error);
