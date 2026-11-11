import { GitHubRepo } from "@/types";

const GITHUB_USERNAME = "KSS-1227";

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "karthik-portfolio",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.warn(`GitHub API returned status ${res.status}. Falling back to default list.`);
      return getFallbackRepos();
    }

    const repos: GitHubRepo[] = await res.json();
    return repos;
  } catch (error) {
    console.warn("Failed to fetch GitHub repositories:", error);
    return getFallbackRepos();
  }
}

function getFallbackRepos(): GitHubRepo[] {
  return [
    {
      id: 101,
      name: "algorithms-and-ds",
      full_name: `${GITHUB_USERNAME}/algorithms-and-ds`,
      description: "Implementations of core data structures and algorithmic patterns in Go and C++.",
      html_url: `https://github.com/${GITHUB_USERNAME}/algorithms-and-ds`,
      homepage: null,
      stargazers_count: 2,
      forks_count: 0,
      language: "Go",
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      fork: false,
    },
    {
      id: 102,
      name: "neural-network-from-scratch",
      full_name: `${GITHUB_USERNAME}/neural-network-from-scratch`,
      description: "Feedforward neural network and autograd engine written in pure Python/NumPy.",
      html_url: `https://github.com/${GITHUB_USERNAME}/neural-network-from-scratch`,
      homepage: null,
      stargazers_count: 5,
      forks_count: 1,
      language: "Python",
      updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      fork: false,
    },
    {
      id: 103,
      name: "kv-storage-engine",
      full_name: `${GITHUB_USERNAME}/kv-storage-engine`,
      description: "Log-structured merge-tree (LSM) key-value storage engine prototype.",
      html_url: `https://github.com/${GITHUB_USERNAME}/kv-storage-engine`,
      homepage: null,
      stargazers_count: 3,
      forks_count: 0,
      language: "C++",
      updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      fork: false,
    },
    {
      id: 104,
      name: "http-parser-sandbox",
      full_name: `${GITHUB_USERNAME}/http-parser-sandbox`,
      description: "Toy RFC-compliant HTTP/1.1 stream parser and socket server.",
      html_url: `https://github.com/${GITHUB_USERNAME}/http-parser-sandbox`,
      homepage: null,
      stargazers_count: 1,
      forks_count: 0,
      language: "TypeScript",
      updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      fork: false,
    },
  ];
}
