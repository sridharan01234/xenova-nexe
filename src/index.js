#!/usr/bin/env node

const { Command } = require('commander');
const { initWorkspace } = require('./commands/init');
const { processWorkspace } = require('./commands/process');
const { version } = require('../package.json');

const program = new Command();

program
  .name('context-provider')
  .description('CLI tool to convert workspaces into vector embeddings using Xenova/Transformers')
  .version(version);

program
  .command('init')
  .description('Initialize workspace vector embedding processing')
  .option('-w, --workspace <path>', 'Path to workspace directory')
  .option('-m, --model <model>', 'Embedding model to use', 'Xenova/all-MiniLM-L6-v2')
  .option('-o, --output <path>', 'Output directory for embeddings', './embeddings')
  .option('--max-tokens <number>', 'Maximum tokens per chunk', '512')
  .option('--overlap <number>', 'Overlap between chunks', '50')
  .action(initWorkspace);

program
  .command('process')
  .description('Process workspace and generate embeddings')
  .option('-w, --workspace <path>', 'Path to workspace directory')
  .option('-m, --model <model>', 'Embedding model to use', 'Xenova/all-MiniLM-L6-v2')
  .option('-o, --output <path>', 'Output directory for embeddings', './embeddings')
  .option('--max-tokens <number>', 'Maximum tokens per chunk', '512')
  .option('--overlap <number>', 'Overlap between chunks', '50')
  .action(processWorkspace);

program.parse();
