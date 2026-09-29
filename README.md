# KNOVA Learning Loop

**Read a synthetic note(合成笔记), hide it, explain it in English, and get an adaptive review date(自适应复习日期).**

[Report a problem(报告问题)](https://github.com/leoyue06/knova-learning-loop-public/issues)

KNOVA Learning Loop is a deliberately small public experiment(公开实验). It tests one learning outcome(学习结果): can open-ended recall(开放式回忆), transparent rubric feedback(透明评分反馈), and FSRS scheduling(FSRS 排程) make a professional-English idea easier to retrieve later?

## Run it locally(本地运行)

```bash
git clone https://github.com/leoyue06/knova-learning-loop-public.git
cd knova-learning-loop-public
npm install
npm run dev
```

No account(账号), API key(接口密钥), database(数据库), or private workspace(私有工作区) is required.

## 30-second walkthrough(演示流程)

1. Read the short note and select **Hide note & recall**.
2. Answer by typing, or use the microphone if your browser supports it.
3. Compare your answer with the visible rubric(评分标准) and reference answer(参考答案).
4. Finish the note to receive a real next-review date from [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs).

```text
synthetic note(合成笔记)
       ↓ read, then hide
spoken or typed explanation(口头或文字解释)
       ↓
transparent rubric feedback(透明评分反馈)
       ↓
real FSRS review date(真实复习日期)
```

## Honest scope(真实范围)

This sample uses prepared questions and a deterministic phrase rubric(确定性短语评分), not a language model(大语言模型). That keeps the app inspectable, free to run, and safe without a server. The score maps to an FSRS rating using explicit boundaries covered by tests.

Included:

- three original professional-English notes with synthetic data(合成数据);
- typed recall and optional browser speech recognition(浏览器语音识别);
- transparent criterion matching and a reference answer;
- real FSRS scheduling with local sample progress;
- keyboard access, visible focus, reduced-motion support, and a typing fallback.

Not included:

- an editor, accounts, sync, chat, RAG, browser automation, or model-provider abstraction;
- private notes, production endpoints, credentials, deployment configuration, or source history from another repository;
- personal-data durability. Do not enter sensitive information; only sample review progress is saved in this browser.

An AI grader(大模型评分器) or custom-note flow(自定义笔记流程) should be added only after real learners ask for it.

## Can someone copy it?(别人能复制吗？)

Yes. Open source(开源) means people may study, modify, redistribute, and commercially use the code, subject to the license(许可证). This repository uses **AGPL-3.0-only**: if someone modifies the covered program and lets users interact with it over a network, those users must be offered the corresponding source under the same license.

The license does not protect an abstract idea, prevent every look-alike product, or remove the possibility of enforcement. The practical boundary is architectural: this repository contains one reproducible learning loop, while private data, services, operations, and future hosted convenience can remain outside it. See [Project identity and non-affiliation](BRAND.md).

## Privacy and voice(隐私与语音)

The app has no analytics(分析追踪) and makes no application API calls after loading its static files. It stores only review dates and scores for the bundled synthetic notes in browser `localStorage`. **Reset sample progress** removes that data.

Speech is optional and starts only after a click. Browser speech recognition may send audio to the browser vendor's service; that behavior is controlled by the browser, not this app. Typing always remains available.

## Development(开发)

```bash
npm test
npm run build
npm run check
```

The runtime(运行时) is vanilla browser JavaScript plus one scheduling dependency, `ts-fsrs`. Vite is used only for local development and a static build(静态构建).

## Contributing and security(贡献与安全)

Small issues and pull requests(拉取请求) that improve the single learning loop are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before adding scope. Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/leoyue06/knova-learning-loop-public/security/advisories/new); see [SECURITY.md](SECURITY.md).

## License(许可证)

Copyright © 2026 KNOVA Learning Loop contributors.

Licensed under [GNU Affero General Public License v3.0 only](LICENSE). Third-party notices(第三方声明) are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
