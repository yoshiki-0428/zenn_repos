---
title: PyGithubを使って特定リポジトリにファイルをコミットする
emoji: 📝
type: tech
topics: [Python, GitHub]
published: true
---


# はじめに


PyGithubを使用してファイルをコミットするコードを書いたので備忘録として書いておきます


# きっかけ


前回の記事でLambdaファンクションを作るときに使用したので記事にしました


[https://github.com/yoshiki-0428/esa-source-lambda](https://github.com/yoshiki-0428/esa-source-lambda)


![https://img.esa.io/uploads/production/attachments/15569/2020/06/12/82539/3cd30d55-cd21-4753-bb4c-5351c395d39e.png](https://img.esa.io/uploads/production/attachments/15569/2020/06/12/82539/3cd30d55-cd21-4753-bb4c-5351c395d39e.png)


# 内容


## まずは pip install


```text
pip install pygithub

```


## 特定のファイルをコミットするコード


PyGithubでは内部的にGitHub Data API v3 を使用しています。なので[こちら](https://developer.github.com/v3/git/)の記事の中のRefs, Tree, Commit周りの関係性を理解しておくと良いです。


```text
import os

from github import Github
from github import InputGitTreeElement

token = os.environ.get("GITHUB_TOKEN")
repository = "yoshiki-0428/repository"

def main():
    commit_file("hoge-file.md", "hogehoge, hoge")
    print("complete")


# Repository Info
def get_repo():
    repo = Github(token).get_repo(repository)
    refs = repo.get_git_ref(branch_name)
    return {
        "repo": repo,
        "refs": refs
    }


def commit_file(commit_name, commit_file_text):
    if commit_name == "" or commit_file_text == "":
        return
    # Repository Info
    repo_info = get_repo()

    # Commit file (Create)
    element = InputGitTreeElement(commit_name, '100644', 'base64', commit_file_text)

    # 最新版のCommit情報を取得
    commit = repo_info['repo'].get_commit(repo_info['refs'].object.sha).commit
    base_tree = commit.tree

    # 新しくCommitを作成
    new_tree = repo_info['repo'].create_git_tree([element], base_tree)
    new_commit = repo_info['repo'].create_git_commit("Create file: " + commit_name, new_tree, [commit])
    repo_info['refs'].edit(new_commit.sha)

```


# まとめ


たったこれだけのコードでGitHub APIを使用してファイルのコミットが簡単にできてしまいます！ライブラリ様様ですね。。


# 参考URL

- [GitHub Data API v3](https://developer.github.com/v3/git/)
- [pygithub](https://pygithub.readthedocs.io/en/latest/)
- [GitHub APIでgit commit](https://int128.hatenablog.com/entry/2017/09/05/161641)
