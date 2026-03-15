import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

const SKILL_TEMPLATE = `---
name: {{name}}
description: What this skill does and when to use it
---

# {{name}}

Instructions for the agent to follow when this skill is activated.

## When to Use

Describe the scenarios where this skill should be used.

## Steps

1. First, do this
2. Then, do that
`;

export async function init(name?: string): Promise<void> {
  let skillName = name;
  
  if (!skillName) {
    skillName = 'my-skill';
  }
  
  const skillDir = path.join(process.cwd(), skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  
  if (await fs.pathExists(skillDir)) {
    console.log(chalk.yellow(`Directory "${skillName}" already exists.`));
    return;
  }
  
  await fs.ensureDir(skillDir);
  
  const content = SKILL_TEMPLATE.replace(/\{\{name\}\}/g, skillName);
  await fs.writeFile(skillFile, content);
  
  console.log(chalk.green(`✓ Created skill template at ${skillDir}/SKILL.md`));
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Edit ${skillName}/SKILL.md to define your skill`);
  console.log(`  2. Run: npx mnemonic add ./${skillName}`);
}
