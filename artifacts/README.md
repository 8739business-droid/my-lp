# artifacts

前セッションで公開したアーティファクトのローカル控え。各ファイルは単体で開ける標準HTMLとして保存してあり、ここで編集してから再公開できる。

| ファイル | 内容 | 元アーティファクト |
| --- | --- | --- |
| `story-marketing-14day.html` | 物語マーケティング14日（14日カリキュラム） | https://claude.ai/artifact/33Cs52JNzjPVnZFZnydTrn |
| `story-scoring-dojo.html` | ストーリー採点道場 | https://claude.ai/artifact/EaeGwxCFMrHggMZVozN9V4 |
| `story-design-30day.html` | 物語設計30日（30日カリキュラム） | https://claude.ai/artifact/UJsUy5VqE316y2H7zFLrgk |

## 注意

- `story-scoring-dojo.html` は公開アーティファクトのランタイム機能（`db` / `sample` / `user` capability）を使う。`window.claude.use(...)` を呼ぶ採点・履歴保存の部分は claude.ai 上で公開ページとして開いたときのみ動作し、ローカルでファイルを直接開いても採点は動かない（レイアウトとタイマーは動く）。他2ファイルは静的なので、ローカルでそのまま表示できる。
- 元のアーティファクトを更新する場合は、ここで編集したファイルを Artifact ツールの publish で該当 URL に再公開する。
