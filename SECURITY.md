# Security policy(安全政策)

## Supported version(支持版本)

Security fixes(安全修复) target the current `main` branch. This repository is a static sample application(静态样例应用), not a hosted data service.

## Report a vulnerability(报告漏洞)

Please use [GitHub private vulnerability reporting(私密漏洞报告)](https://github.com/leoyue06/knova-learning-loop-public/security/advisories/new). Do not open a public issue for an undisclosed vulnerability.

Include the affected commit, reproduction steps, expected impact, and any suggested mitigation. You should receive an acknowledgement through the advisory within seven days.

## Data boundary(数据边界)

The checked-in workspace is synthetic. The app has no account system, backend, production endpoint, analytics, or credential storage. It saves only bundled-note scores and review dates in browser `localStorage`; users can clear them from the page.

Browser speech recognition(浏览器语音识别) is optional and may use a browser-vendor service. Never submit secrets or sensitive personal information in the sample answer box.
