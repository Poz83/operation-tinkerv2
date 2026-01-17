/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const CHANGELOG_PATH = path.join(process.cwd(), 'src/data/changelog.ts');

function getGitCommits(sinceDate: string): string[] {
    try {
        // Get commits since the last update, excluding merges
        const cmd = `git log --since="${sinceDate} 00:00:00" --pretty=format:"%s" --no-merges`;
        const output = execSync(cmd).toString();
        return output.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
        console.error('Error fetching git log:', error);
        return [];
    }
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

function updateChangelog() {
    console.log('🔄 Checking for updates to Changelog...');

    // 1. Read existing changelog to find last date
    const fileContent = readFileSync(CHANGELOG_PATH, 'utf-8');

    // Regex to find the most recent date in the file (assuming top entry is newest)
    const dateMatch = fileContent.match(/date:\s*'(\d{4}-\d{2}-\d{2})'/);

    if (!dateMatch) {
        console.error('❌ Could not find a valid date in changelog.ts');
        return;
    }

    const lastDate = dateMatch[1];
    const today = formatDate(new Date());

    // 2. Get commits since the last entry
    console.log(`🔍 Looking for commits since ${lastDate}...`);
    const commits = getGitCommits(lastDate);

    if (commits.length === 0) {
        console.log('✨ No new commits found to add.');
        return;
    }

    // 3. Filter and format commits
    // STRICT FILTERING: Only include meaningful user-facing changes (feat, fix, perf)
    const changes = commits
        .filter(msg => {
            const m = msg.toLowerCase();
            return m.startsWith('feat') || m.startsWith('fix') || m.startsWith('perf');
        })
        .map(msg => msg.replace(/^feat:|^fix:|^perf:/, '').trim()) // Remove prefixes
        .map(msg => msg.charAt(0).toUpperCase() + msg.slice(1)) // Capitalize
        .filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

    if (changes.length === 0) {
        console.log('✨ No relevant changes found.');
        return;
    }

    console.log(`📝 Found ${changes.length} changes. Updating changelog...`);

    // 4. Construct new entry
    const newId = `update-${today}`;
    const newEntry = `    {
        id: '${newId}',
        date: '${today}',
        title: 'Development Update',
        version: 'v2.1.x',
        description: 'Latest changes and improvements based on recent development.',
        changes: [
            ${changes.map(c => `'${c.replace(/'/g, "\\'")}'`).join(',\n            ')}
        ],
        type: 'minor'
    },`;

    // 5. Inject into file
    // Look for the start of the array: "export const CHANGELOG: ChangelogEntry[] = ["
    const updatedContent = fileContent.replace(
        /(export const CHANGELOG: ChangelogEntry\[\] = \[)/,
        `$1\n${newEntry}`
    );

    writeFileSync(CHANGELOG_PATH, updatedContent, 'utf-8');
    console.log('🚀 Changelog updated successfully!');
}

updateChangelog();
