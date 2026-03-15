import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { add } from './add.js';
import { list } from './list.js';
import { remove } from './remove.js';

export const cli = async () => {
  await yargs(hideBin(process.argv))
    .scriptName('mnemonic')
    .usage('$0 <command> [options]')
    .command(
      'add <source>',
      'Add skills from a source (GitHub repo, local path, or git URL)',
      (yargs) => {
        return yargs
          .positional('source', {
            type: 'string',
            describe: 'Skill source (owner/repo, URL, or local path)',
            demandOption: true,
          })
          .option('global', {
            alias: 'g',
            type: 'boolean',
            describe: 'Install to global directory instead of project',
            default: false,
          })
          .option('agent', {
            alias: 'a',
            type: 'array',
            string: true,
            describe: 'Target specific agents (e.g., trae, claude-code, cursor)',
          })
          .option('skill', {
            alias: 's',
            type: 'array',
            string: true,
            describe: 'Install specific skills by name (use "*" for all)',
          })
          .option('list', {
            alias: 'l',
            type: 'boolean',
            describe: 'List available skills without installing',
            default: false,
          })
          .option('copy', {
            type: 'boolean',
            describe: 'Copy files instead of symlinking',
            default: false,
          })
          .option('yes', {
            alias: 'y',
            type: 'boolean',
            describe: 'Skip confirmation prompts',
            default: false,
          })
          .option('all', {
            type: 'boolean',
            describe: 'Install all skills to all agents',
            default: false,
          });
      },
      async (argv) => {
        await add({
          source: argv.source as string,
          global: argv.global,
          agent: argv.agent as string[] | undefined,
          skill: argv.skill as string[] | undefined,
          list: argv.list,
          copy: argv.copy,
          yes: argv.yes,
          all: argv.all,
        });
      }
    )
    .command(
      ['list', 'ls'],
      'List installed skills',
      (yargs) => {
        return yargs
          .option('global', {
            alias: 'g',
            type: 'boolean',
            describe: 'List global skills only',
            default: false,
          })
          .option('agent', {
            alias: 'a',
            type: 'array',
            string: true,
            describe: 'Filter by specific agents',
          });
      },
      async (argv) => {
        await list({
          global: argv.global,
          agent: argv.agent as string[] | undefined,
        });
      }
    )
    .command(
      ['remove [skills...]', 'rm [skills...]'],
      'Remove installed skills',
      (yargs) => {
        return yargs
          .positional('skills', {
            type: 'string',
            array: true,
            describe: 'Skill names to remove',
          })
          .option('global', {
            alias: 'g',
            type: 'boolean',
            describe: 'Remove from global scope',
            default: false,
          })
          .option('agent', {
            alias: 'a',
            type: 'array',
            string: true,
            describe: 'Remove from specific agents (use "*" for all)',
          })
          .option('yes', {
            alias: 'y',
            type: 'boolean',
            describe: 'Skip confirmation prompts',
            default: false,
          })
          .option('all', {
            type: 'boolean',
            describe: 'Remove all skills',
            default: false,
          });
      },
      async (argv) => {
        await remove({
          skills: argv.skills as string[] | undefined,
          global: argv.global,
          agent: argv.agent as string[] | undefined,
          yes: argv.yes,
          all: argv.all,
        });
      }
    )
    .command(
      'init [name]',
      'Create a new SKILL.md template',
      (yargs) => {
        return yargs.positional('name', {
          type: 'string',
          describe: 'Skill name (creates a subdirectory)',
        });
      },
      async (argv) => {
        const { init } = await import('./init.js');
        await init(argv.name as string | undefined);
      }
    )
    .demandCommand(1, 'Please specify a command')
    .strict()
    .alias('h', 'help')
    .alias('v', 'version')
    .epilogue(
      'Examples:\n' +
        '  $0 add owner/repo                    # Install from GitHub shorthand\n' +
        '  $0 add https://github.com/owner/repo # Install from full URL\n' +
        '  $0 add ./my-skill                    # Install from local path\n' +
        '  $0 add owner/repo -g -a trae         # Install globally to trae\n' +
        '  $0 list                              # List installed skills\n' +
        '  $0 remove skill-name                 # Remove a skill'
    )
    .parse();
};
