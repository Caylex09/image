# my-album 自用命令

```bash
git checkout my-album          # 切到我的相册分支
git add .                      # 把改动加入暂存区
git commit -m "update album"   # 提交我的修改
git push origin my-album       # 推送到远端

git checkout main              # 切到模板分支
git pull origin main           # 拉取模板最新更新
git checkout my-album          # 切回我的分支
git merge main                 # 把模板更新合并到我的相册
git push origin my-album       # 把合并结果推送到远端

git status -sb                 # 看当前分支和改动状态
```

- `main`：模板
- `my-album`：我的相册