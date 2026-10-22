import { GITHUB_REPOSITORY } from "../lib/project";
export default function GitHubLink({ prominent = false }: { prominent?: boolean }) {
  return <a className={prominent ? "github-source-card" : "github-header"} href={GITHUB_REPOSITORY} target="_blank" rel="noopener noreferrer" aria-label={prominent ? "查看 neo770013-rgb 的 Papaya-Portfolio GitHub 源码仓库" : "GitHub 项目源码（新窗口）"}>
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.73 2.63 1.23 3.27.94.1-.73.4-1.23.71-1.51-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.43.11-2.99 0 0 .95-.3 3.09 1.16a10.7 10.7 0 0 1 5.62 0c2.14-1.46 3.08-1.16 3.08-1.16.62 1.56.23 2.71.12 2.99.72.79 1.15 1.8 1.15 3.03 0 4.32-2.63 5.27-5.14 5.55.4.35.77 1.04.77 2.1v3.1c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z"/></svg>
    {prominent ? <span><b>项目源码 · GitHub</b><small>neo770013-rgb / Papaya-Portfolio</small></span> : <span>GitHub 源码</span>}
    <span className="github-arrow" aria-hidden="true">↗</span>
  </a>;
}
