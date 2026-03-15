import path from 'path';
import fs from 'fs-extra';
import { SourceInfo } from './types.js';

const GITHUB_SHORTHAND_REGEX = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(?:\/(.+))?$/;
const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?(?:\.git)?$/;
const GITLAB_URL_REGEX = /^https?:\/\/gitlab\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)(?:\/-\/tree\/([^/]+)(?:\/(.+))?)?$/;
const GIT_URL_REGEX = /^(?:git|ssh|https?):\/\/.+/;
const NPM_PACKAGE_REGEX = /^(@[a-zA-Z0-9_-]+\/)?[a-zA-Z0-9_-]+$/;

export function parseSource(source: string): SourceInfo {
  const trimmedSource = source.trim();
  
  if (isLocalPath(trimmedSource)) {
    return parseLocalSource(trimmedSource);
  }
  
  if (isGitHubShorthand(trimmedSource)) {
    return parseGitHubShorthand(trimmedSource);
  }
  
  if (isGitHubUrl(trimmedSource)) {
    return parseGitHubUrl(trimmedSource);
  }
  
  if (isGitLabUrl(trimmedSource)) {
    return parseGitLabUrl(trimmedSource);
  }
  
  if (isGitUrl(trimmedSource)) {
    return parseGitUrl(trimmedSource);
  }
  
  if (isNpmPackage(trimmedSource)) {
    return parseNpmSource(trimmedSource);
  }
  
  throw new Error(`Unable to parse source: ${source}`);
}

function isLocalPath(source: string): boolean {
  if (source.startsWith('./') || source.startsWith('../') || source.startsWith('/')) {
    return true;
  }
  if (source.startsWith('~')) {
    return true;
  }
  if (source.includes(path.sep) && !source.includes('://')) {
    return true;
  }
  return false;
}

function parseLocalSource(source: string): SourceInfo {
  let resolvedPath = source;
  
  if (source.startsWith('~')) {
    resolvedPath = path.join(process.env.HOME || '', source.slice(1));
  } else if (!path.isAbsolute(source)) {
    resolvedPath = path.resolve(process.cwd(), source);
  }
  
  if (!fs.pathExistsSync(resolvedPath)) {
    throw new Error(`Local path does not exist: ${resolvedPath}`);
  }
  
  return {
    type: 'local',
    url: resolvedPath,
  };
}

function isGitHubShorthand(source: string): boolean {
  return GITHUB_SHORTHAND_REGEX.test(source);
}

function parseGitHubShorthand(source: string): SourceInfo {
  const match = source.match(GITHUB_SHORTHAND_REGEX);
  if (!match) {
    throw new Error(`Invalid GitHub shorthand: ${source}`);
  }
  
  const [, owner, repo, subpath] = match;
  const cleanRepo = repo.replace(/\.git$/, '');
  
  return {
    type: 'github',
    url: `https://github.com/${owner}/${cleanRepo}`,
    owner,
    repo: cleanRepo,
    subpath: subpath || undefined,
  };
}

function isGitHubUrl(source: string): boolean {
  return GITHUB_URL_REGEX.test(source);
}

function parseGitHubUrl(source: string): SourceInfo {
  const match = source.match(GITHUB_URL_REGEX);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${source}`);
  }
  
  const [, owner, repo, branch, subpath] = match;
  
  return {
    type: 'github',
    url: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
    branch: branch || 'main',
    subpath: subpath || undefined,
  };
}

function isGitLabUrl(source: string): boolean {
  return GITLAB_URL_REGEX.test(source);
}

function parseGitLabUrl(source: string): SourceInfo {
  const match = source.match(GITLAB_URL_REGEX);
  if (!match) {
    throw new Error(`Invalid GitLab URL: ${source}`);
  }
  
  const [, owner, repo, branch, subpath] = match;
  
  return {
    type: 'gitlab',
    url: `https://gitlab.com/${owner}/${repo}`,
    owner,
    repo,
    branch: branch || 'main',
    subpath: subpath || undefined,
  };
}

function isGitUrl(source: string): boolean {
  return GIT_URL_REGEX.test(source);
}

function parseGitUrl(source: string): SourceInfo {
  return {
    type: 'git',
    url: source,
  };
}

function isNpmPackage(source: string): boolean {
  return NPM_PACKAGE_REGEX.test(source) && !source.includes('/');
}

function parseNpmSource(source: string): SourceInfo {
  return {
    type: 'npm',
    url: source,
    repo: source,
  };
}

export function getCloneUrl(source: SourceInfo): string {
  switch (source.type) {
    case 'github':
      return `${source.url}.git`;
    case 'gitlab':
      return `${source.url}.git`;
    case 'git':
      return source.url;
    default:
      throw new Error(`Cannot clone source type: ${source.type}`);
  }
}

export function getSourceDisplayName(source: SourceInfo): string {
  switch (source.type) {
    case 'github':
    case 'gitlab':
      return `${source.owner}/${source.repo}`;
    case 'git':
      return source.url;
    case 'local':
      return source.url;
    case 'npm':
      return source.repo || source.url;
    default:
      return source.url;
  }
}
